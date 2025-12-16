/**
 * CMS API response types
 * Matches the data structure from blog-cms public API
 */

// Category from CMS (enhanced with path info)
export interface CMSCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  order: number
  level: number // Depth in category tree (0 = root)
  path: string // Full slug path (e.g., "frontend/react")
  postCount: number // Direct posts count
  totalPostCount: number // Including all descendants
  children?: CMSCategory[] // Nested subcategories
  createdAt?: string
}

// Tag from CMS
export interface CMSTag {
  id: string
  name: string
  slug: string
  createdAt: string
}

// Author from CMS
export interface CMSAuthor {
  id: string
  name: string
  email: string
  avatar: string | null
}

// Post-Tag relation from CMS
export interface CMSPostTag {
  postId: string
  tagId: string
  tag: CMSTag
}

// Single post from CMS API
export interface CMSPost {
  id: string
  title: string
  slug: string
  subtitle: string | null
  content: string
  excerpt: string | null
  ogImage: string | null
  draft: boolean
  toc: boolean
  share: boolean
  giscus: boolean
  search: boolean
  radio: boolean
  video: boolean
  platform: string | null
  minutesRead: number | null
  pubDate: string
  lastModDate: string | null
  categoryId: string | null
  authorId: string | null
  createdAt: string
  updatedAt: string
  // Relations
  category: CMSCategory | null
  author: CMSAuthor | null
  postTags: CMSPostTag[]
  // Enhanced: full category path for URL (slug-based)
  categoryPath: string | null
  // Enhanced: full category name path for display (name-based)
  categoryNamePath: string | null
}

// Posts list API response (without content)
export interface CMSPostsResponse {
  posts: CMSPostListItem[]
  total: number
  limit: number
  offset: number
}

// Posts list API response (with full content)
export interface CMSPostsWithContentResponse {
  posts: CMSPost[]
  total: number
  limit: number
  offset: number
}

// Post list item (without full content)
export interface CMSPostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  draft: boolean
  pubDate: string
  updatedAt: string
  categoryId: string | null
  categoryName: string | null
}

// Loader options
export interface CMSLoaderOptions {
  /**
   * CMS API base URL
   * @example 'https://cms.example.com'
   */
  apiBaseUrl: string

  /**
   * Number of posts to fetch per request
   * @default 100
   */
  batchSize?: number
}
