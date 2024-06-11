import axios from 'axios'

import type { GitHubFile } from '@/types/github'

const GITHUB_API_URL = 'https://api.github.com'

const githubClient = axios.create({
  baseURL: GITHUB_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  },
})

export const getArticles = async (): Promise<GitHubFile[]> => {
  try {
    const response = await githubClient.get<GitHubFile[]>(
      `/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/articles`
    )
    return response.data.filter((file) => file.name.endsWith('.md'))
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    throw error
  }
}

export const getArticleContent = async (path: string): Promise<string> => {
  const response = await githubClient.get<{ content: string }>(
    `/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${path}`
  )
  const content = Buffer.from(response.data.content, 'base64').toString('utf-8')
  return content
}

export const getArticleDate = async (path: string): Promise<string> => {
  try {
    const response = await githubClient.get<
      { commit: { committer: { date: string } } }[]
    >(`/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/commits`, {
      params: { path, per_page: 1 },
    })
    return response.data[0].commit.committer.date
  } catch (error) {
    console.error('Failed to fetch article date:', error)
    throw error
  }
}
