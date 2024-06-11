import matter from 'gray-matter'

import type { Article, ArticleData } from '@/types/article'
import { getArticleContent, getArticleDate, getArticles } from './github'

const encodeSlug = (filePath: string): string => {
  return encodeURIComponent(filePath.replace(/\.md?$/, ''))
}

const decodeSlug = (slug: string): string => {
  return decodeURIComponent(slug)
}

export const getAllArticleSlugs = async (): Promise<string[]> => {
  const articleFiles = await getArticles()
  return articleFiles.map((file) => encodeSlug(file.name))
}

export const getArticleBySlug = async (slug: string): Promise<Article> => {
  const decodedSlug = decodeSlug(slug)
  const markdown = await getArticleContent(`/articles/${decodedSlug}.md`)
  const { content, data } = matter(markdown)
  const date = await getArticleDate(`articles/${decodedSlug}.md`)

  // published_atがない場合はdateを代入
  data.published_at ??= date

  const articleData: ArticleData = {
    title: data.title as string,
    emoji: data.emoji as string,
    type: data.type as string,
    topics: data.topics as string[],
    published: data.published as boolean,
    published_at: data.published_at as string,
  }

  return {
    slug,
    content,
    data: articleData,
  }
}

export const getAllArticles = async (): Promise<Article[]> => {
  const slugs = await getAllArticleSlugs()
  const articles = await Promise.all(
    slugs.map((slug) => getArticleBySlug(slug))
  )

  const isDevelopment = process.env.NODE_ENV === 'development'
  const now = new Date().getTime()
  return articles
    .filter(
      (article) =>
        isDevelopment ||
        (article.data.published &&
          new Date(article.data.published_at).getTime() <= now)
    )
    .sort(
      (a, b) =>
        new Date(b.data.published_at).getTime() -
        new Date(a.data.published_at).getTime()
    )
}

export const getAllArticlesTopics = async (): Promise<
  { topic: string; count: number }[]
> => {
  const articles = await getAllArticles()
  const topicCounts: Record<string, number> = {}

  articles.forEach((article) => {
    article.data.topics.forEach((topic) => {
      if (topicCounts[topic]) {
        topicCounts[topic]++
      } else {
        topicCounts[topic] = 1
      }
    })
  })

  const sortedTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => {
      if (b.count === a.count) {
        return a.topic.localeCompare(b.topic, 'ja')
      }
      return b.count - a.count
    })

  return sortedTopics
}
