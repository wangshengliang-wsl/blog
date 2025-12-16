/**
 * CMS API Client
 *
 * This file provides functions to fetch blog content from the CMS API.
 * To use the CMS, set the CMS_API_URL environment variable.
 *
 * If CMS_API_URL is not set, the blog will continue to use local MDX files.
 */

const CMS_API_URL = import.meta.env.CMS_API_URL || ''

export interface Tag {
  id: string
  name: string
  slug: string
  [key: string]: unknown
}

export interface PostTagItem {
  tag: Tag
  [key: string]: unknown
}

export interface CMSPost {
  id: string
  title: string
  slug: string
  subtitle?: string
  content: string
  excerpt?: string
  ogImage?: string
  draft: boolean
  toc: boolean
  share: boolean
  giscus: boolean
  search: boolean
  radio: boolean
  video: boolean
  platform?: string
  minutesRead?: number
  pubDate: string
  lastModDate?: string
  categoryId?: string
  categoryName?: string
  postTags?: PostTagItem[]
}

export interface CMSCategory {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  order: number
  postCount: number
}

export interface CMSPostsResponse {
  posts: CMSPost[]
  total: number
  limit: number
  offset: number
}

/**
 * Check if CMS API is configured
 */
export function isCMSEnabled(): boolean {
  return !!CMS_API_URL
}

/**
 * Fetch all published posts from CMS
 */
export async function fetchPosts(options?: {
  limit?: number
  offset?: number
  categoryId?: string
}): Promise<CMSPostsResponse> {
  if (!CMS_API_URL) {
    throw new Error('CMS_API_URL is not configured')
  }

  const params = new URLSearchParams()
  if (options?.limit) params.set('limit', options.limit.toString())
  if (options?.offset) params.set('offset', options.offset.toString())
  if (options?.categoryId) params.set('categoryId', options.categoryId)

  const url = `${CMS_API_URL}/api/public/posts?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug: string): Promise<CMSPost | null> {
  if (!CMS_API_URL) {
    throw new Error('CMS_API_URL is not configured')
  }

  const url = `${CMS_API_URL}/api/public/posts/${encodeURIComponent(slug)}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<CMSCategory[]> {
  if (!CMS_API_URL) {
    throw new Error('CMS_API_URL is not configured')
  }

  const url = `${CMS_API_URL}/api/public/categories`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Transform CMS post to match Astro content collection format
 */
export function transformCMSPostToCollectionEntry(post: CMSPost) {
  return {
    id: post.slug,
    slug: post.slug,
    data: {
      title: post.title,
      subtitle: post.subtitle || '',
      description: post.excerpt || '',
      pubDate: new Date(post.pubDate),
      lastModDate: post.lastModDate ? new Date(post.lastModDate) : undefined,
      minutesRead: post.minutesRead,
      category: post.categoryName || '杂谈',
      tags: post.postTags?.map((pt) => pt.tag.name) || [],
      draft: post.draft,
      toc: post.toc,
      share: post.share,
      giscus: post.giscus,
      search: post.search,
      radio: post.radio,
      video: post.video,
      platform: post.platform || '',
      ogImage: post.ogImage || true,
    },
    body: post.content,
    render: async () => ({
      Content: () => null, // Will need MDX rendering
      headings: [],
      remarkPluginFrontmatter: {},
    }),
  }
}

/**
 * Music API Types
 */
export interface CMSSong {
  id: string
  name: string
  duration: string
  url: string
}

export interface CMSAlbum {
  id: string
  name: string
  description?: string
  artist: string
  cover?: string
  color?: string
  songs: CMSSong[]
}

export interface CMSMusicResponse {
  albums: CMSAlbum[]
  total: number
}

/**
 * Fetch all published albums with songs from CMS
 */
export async function fetchMusic(): Promise<CMSAlbum[]> {
  if (!CMS_API_URL) {
    throw new Error('CMS_API_URL is not configured')
  }

  const url = `${CMS_API_URL}/api/public/music`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch music: ${response.statusText}`)
  }

  const data: CMSMusicResponse = await response.json()
  return data.albums
}
