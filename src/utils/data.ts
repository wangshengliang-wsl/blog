import { getCollection, render } from 'astro:content'

import { resolvePath } from './path'

import type { CollectionEntry, CollectionKey } from 'astro:content'
import type { CardItemData } from '~/components/views/CardItem.astro'
import type { GitHubView } from '~/types'

const defaultCategory = '杂谈'

/**
 * Extracts the last segment from a category path (e.g., "Vue/5-VueRouter" -> "VueRouter")
 */
export function getLastCategorySegment(category: string): string {
  const segments = category.split('/')
  const lastSegment = segments[segments.length - 1] || category
  // Remove number prefix like "5-" from "5-VueRouter"
  return lastSegment.replace(/^\d+-/, '')
}

/**
 * Tree node for hierarchical category structure
 */
export interface CategoryTreeNode {
  name: string
  path: string
  children: CategoryTreeNode[]
  posts: CollectionEntry<'blog' | 'changelog'>[]
}

/**
 * Extracts a number prefix from a path segment for sorting (e.g., "01-快速入门" -> 1)
 */
function extractPathNumber(segment: string): number {
  const match = segment.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : Infinity
}

/**
 * Formats display name by removing number prefix (e.g., "01-快速入门" -> "快速入门")
 */
function formatDisplayName(segment: string): string {
  return segment.replace(/^\d+-/, '')
}

/**
 * Builds a hierarchical tree structure from posts based on their file paths.
 */
export function buildCategoryTree(
  posts: CollectionEntryList<'blog' | 'changelog'>
): CategoryTreeNode[] {
  const root = new Map<string, CategoryTreeNode>()

  posts.forEach((post) => {
    const pathParts = post.id.split('/')
    // Last part is the filename, everything before is the category path
    const categoryParts = pathParts.slice(0, -1)

    if (categoryParts.length === 0) {
      // Post is at root level, use frontmatter category or default
      const category = post.data.category || defaultCategory
      if (!root.has(category)) {
        root.set(category, {
          name: category,
          path: category,
          children: [],
          posts: [],
        })
      }
      root.get(category)!.posts.push(post)
      return
    }

    // Build nested structure
    let currentLevel = root
    let currentPath = ''

    categoryParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isLastPart = index === categoryParts.length - 1

      if (!currentLevel.has(part)) {
        const node: CategoryTreeNode = {
          name: formatDisplayName(part),
          path: currentPath,
          children: [],
          posts: [],
        }
        currentLevel.set(part, node)
      }

      const currentNode = currentLevel.get(part)!

      if (isLastPart) {
        currentNode.posts.push(post)
      } else {
        // Move to next level - convert children array to map for easier lookup
        const childMap = new Map<string, CategoryTreeNode>()
        currentNode.children.forEach((child) => {
          const childKey = child.path.split('/').pop() || child.path
          childMap.set(childKey, child)
        })
        currentLevel = childMap

        // Sync back to children array after processing
        if (index < categoryParts.length - 2) {
          // Will continue to deeper level
        }
      }
    })
  })

  // Convert root map to sorted array and recursively sort children
  const sortAndConvert = (
    nodeMap: Map<string, CategoryTreeNode>
  ): CategoryTreeNode[] => {
    const nodes = Array.from(nodeMap.values())

    // Sort nodes: by number prefix first, then alphabetically
    nodes.sort((a, b) => {
      const numA = extractPathNumber(a.path.split('/').pop() || a.path)
      const numB = extractPathNumber(b.path.split('/').pop() || b.path)
      if (numA !== numB) return numA - numB
      // Put default category last
      if (a.name === defaultCategory) return 1
      if (b.name === defaultCategory) return -1
      return a.name.localeCompare(b.name, 'zh-CN')
    })

    // Sort posts within each node
    nodes.forEach((node) => {
      node.posts.sort((a, b) => {
        const numA = extractFileNumber(a.id)
        const numB = extractFileNumber(b.id)
        return numA - numB
      })
    })

    return nodes
  }

  return sortAndConvert(root)
}

/**
 * Recursively builds category tree with proper nesting
 */
export function buildNestedCategoryTree(
  posts: CollectionEntryList<'blog' | 'changelog'>
): CategoryTreeNode[] {
  const root: CategoryTreeNode = {
    name: 'root',
    path: '',
    children: [],
    posts: [],
  }

  // Build a map from lowercase slug to correct case name
  // This uses the frontmatter category field which now contains the full name path
  // e.g., post.id = "frontend/react/post-slug", post.data.category = "Frontend/React"
  const slugToNameMap = new Map<string, string>()
  posts.forEach((post) => {
    const category = post.data.category
    if (category && typeof category === 'string') {
      // Parse both the slug path (from id) and name path (from category)
      const pathParts = post.id.split('/')
      const slugParts = pathParts.slice(0, -1) // Remove filename
      const nameParts = category.split('/')

      // Map each slug to its corresponding name
      // Handle case where lengths might differ (shouldn't happen, but be safe)
      const minLen = Math.min(slugParts.length, nameParts.length)
      for (let i = 0; i < minLen; i++) {
        const slug = slugParts[i].toLowerCase()
        const name = nameParts[i]
        // Only set if not already set (use first occurrence)
        if (!slugToNameMap.has(slug)) {
          slugToNameMap.set(slug, name)
        }
      }
    }
  })

  // Helper to get correct case name for a path segment (slug)
  const getCorrectCaseName = (segment: string): string => {
    const formatted = formatDisplayName(segment)
    // Try to find the correct case from the map
    const correctCase = slugToNameMap.get(formatted.toLowerCase())
    return correctCase || formatted
  }

  // Helper to find or create a node at a given path
  const findOrCreateNode = (
    parent: CategoryTreeNode,
    pathParts: string[],
    fullPath: string
  ): CategoryTreeNode => {
    if (pathParts.length === 0) return parent

    const [current, ...rest] = pathParts
    let child = parent.children.find((c) => c.path.split('/').pop() === current)

    if (!child) {
      const childPath = parent.path ? `${parent.path}/${current}` : current
      child = {
        name: getCorrectCaseName(current),
        path: childPath,
        children: [],
        posts: [],
      }
      parent.children.push(child)
    }

    if (rest.length === 0) return child
    return findOrCreateNode(child, rest, fullPath)
  }

  // Process each post
  posts.forEach((post) => {
    const pathParts = post.id.split('/')
    const categoryParts = pathParts.slice(0, -1)

    if (categoryParts.length === 0) {
      // Root level post - group by frontmatter category
      const category = post.data.category || defaultCategory
      let categoryNode = root.children.find((c) => c.name === category)
      if (!categoryNode) {
        categoryNode = {
          name: category,
          path: category,
          children: [],
          posts: [],
        }
        root.children.push(categoryNode)
      }
      categoryNode.posts.push(post)
    } else {
      const targetNode = findOrCreateNode(root, categoryParts, post.id)
      targetNode.posts.push(post)
    }
  })

  // Recursively sort the tree
  const sortTree = (node: CategoryTreeNode): void => {
    // Sort children by number prefix, then alphabetically
    node.children.sort((a, b) => {
      const segmentA = a.path.split('/').pop() || a.path
      const segmentB = b.path.split('/').pop() || b.path
      const numA = extractPathNumber(segmentA)
      const numB = extractPathNumber(segmentB)
      if (numA !== numB) return numA - numB
      if (a.name === defaultCategory) return 1
      if (b.name === defaultCategory) return -1
      return a.name.localeCompare(b.name, 'zh-CN')
    })

    // Sort posts by filename number
    node.posts.sort((a, b) => {
      const numA = extractFileNumber(a.id)
      const numB = extractFileNumber(b.id)
      return numA - numB
    })

    // Recurse into children
    node.children.forEach(sortTree)
  }

  sortTree(root)
  return root.children
}

/**
 * Flattens tree structure for display with indentation info
 */
export interface FlattenedCategory {
  node: CategoryTreeNode
  depth: number
  hasChildren: boolean
  totalPosts: number
}

function countTotalPosts(node: CategoryTreeNode): number {
  let count = node.posts.length
  node.children.forEach((child) => {
    count += countTotalPosts(child)
  })
  return count
}

export function flattenCategoryTree(
  nodes: CategoryTreeNode[],
  depth = 0
): FlattenedCategory[] {
  const result: FlattenedCategory[] = []

  nodes.forEach((node) => {
    result.push({
      node,
      depth,
      hasChildren: node.children.length > 0,
      totalPosts: countTotalPosts(node),
    })

    if (node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, depth + 1))
    }
  })

  return result
}

type CollectionEntryList<K extends CollectionKey = CollectionKey> =
  CollectionEntry<K>[]

/**
 * Ensures that a value is a positive integer.
 */
function ensurePositiveInteger(value: number, name: string) {
  if (Number.isInteger(value) && value > 0) return value
  throw new Error(
    `'${name}' must be a positive integer. Please check 'src/config.ts' for the correct configuration.`
  )
}

/**
 * Parses a tuple of boolean and number.
 */
export function parseTuple(
  tuple: boolean | [boolean, number] | undefined,
  name: string
) {
  if (!tuple || !Array.isArray(tuple) || !tuple[0]) return undefined
  return ensurePositiveInteger(tuple[1], name)
}

/**
 * Retrieves filtered posts from the specified content collection.
 * In production, it filters out draft posts.
 */
export async function getFilteredPosts(collection: 'blog' | 'changelog') {
  return await getCollection(collection, ({ data }) => {
    return import.meta.env.PROD ? !data.draft : true
  })
}

/**
 * Sorts an array of posts by their publication date in descending order.
 */
export function getSortedPosts(
  posts: CollectionEntryList<'blog' | 'changelog'>
) {
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )
}
/**
 * Extracts the number from the beginning of a filename (e.g., "AI编码提效/1.基本介绍" -> 1)
 */
function extractFileNumber(filepath: string): number {
  // Extract just the filename from the full path
  const filename = filepath.split('/').pop() || ''
  const match = filename.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : Infinity
}

/**
 * Groups posts by their category and sorts them by the number in filename within each category.
 */
export function getPostsByCategory(
  posts: CollectionEntryList<'blog' | 'changelog'>
) {
  const categoriesMap = new Map<
    string,
    CollectionEntryList<'blog' | 'changelog'>
  >()

  // Group posts by category
  posts.forEach((post) => {
    const category = post.data.category || defaultCategory
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, [])
    }
    categoriesMap.get(category)!.push(post)
  })

  // Sort posts within each category by filename number
  categoriesMap.forEach((postsInCategory) => {
    postsInCategory.sort((a, b) => {
      const numA = extractFileNumber(a.id)
      const numB = extractFileNumber(b.id)
      return numA - numB
    })
  })

  // Convert to array and sort categories
  return Array.from(categoriesMap.entries()).sort(([a], [b]) => {
    // Put "杂谈" category last, sort others alphabetically
    if (a === defaultCategory && b !== defaultCategory) return 1
    if (b === defaultCategory && a !== defaultCategory) return -1
    return a.localeCompare(b, 'zh-CN')
  })
}
/**
 * Checks if two posts have the same category.
 */
export function isSameCategory(
  currentPost: CollectionEntry<'blog' | 'changelog'> | undefined,
  previousPost: CollectionEntry<'blog' | 'changelog'> | undefined
): boolean {
  if (!currentPost || !previousPost) return false
  const currentCategory = currentPost.data.category || defaultCategory
  const previousCategory = previousPost.data.category || defaultCategory
  return currentCategory === previousCategory
}

/**
 * Matches the input string against the rules in `UI.githubView.mainLogoOverrides`
 * or `UI.githubView.subLogoMatches`, and returns the matching URL/Icon.
 */
export function matchLogo(
  input: string,
  logos: GitHubView['mainLogoOverrides'] | GitHubView['subLogoMatches']
) {
  for (const [pattern, logo] of logos) {
    if (typeof pattern === 'string') {
      if (input === pattern) {
        return logo
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(input)) {
        return logo
      }
    }
  }
  return undefined
}

/**
 * Extracts the package name (before the `@` version part) from a `tagName`.
 */
export function extractPackageName(tagName: string) {
  const match = tagName.match(/(^@?[^@]+?)(?:@)/)
  if (match) return match[1]
  return tagName
}

/**
 * Extracts the version number from a `tagName`.
 */
export function extractVersionNum(tagName: string) {
  const match = tagName.match(/.+(\d+\.\d+\.\d+(?:-[\w.]+)?)(?:\s|$)/)
  if (match) return match[1]
  return tagName
}

/**
 * Processes the version number and return the highlighted and non-highlighted parts.
 */
export function processVersion(
  versionNum: string
): ['major' | 'minor' | 'patch' | 'pre', string, string] {
  const parts = versionNum.split(/(\.)/g)
  let highlightedIndex = -1
  let versionType: 'major' | 'minor' | 'patch' | 'pre'

  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i] !== '.') {
      const num = +parts[i]
      if (!Number.isNaN(num) && num > 0) {
        highlightedIndex = i
        break
      }
    }
  }

  if (highlightedIndex === 0) {
    versionType = 'major'
  } else if (highlightedIndex === 2) {
    versionType = 'minor'
  } else if (highlightedIndex === 4) {
    versionType = 'patch'
  } else {
    versionType = 'pre'
  }

  const nonHighlightedPart = parts.slice(0, highlightedIndex).join('')
  const highlightedPart = parts.slice(highlightedIndex).join('')

  return [versionType, nonHighlightedPart, highlightedPart]
}

/**
 * Processes blog posts and converts them into `CardItemData` interface.
 */
export async function getShortsFromBlog(data: CollectionEntryList<'blog'>) {
  const cards: CardItemData[] = []
  const basePath = resolvePath('/blog')
  const sortedData = data.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  )

  for (const item of sortedData) {
    const slug = item.id
    const title = item.data.title
    const date = item.data.pubDate

    if (slug === 'markdown-syntax-guide') {
      cards.push({
        link: `${basePath}/${slug}`,
        text: title,
        date: date,
      })
    } else {
      const { headings } = await render(item)
      const neededHeadingLevel = slug === 'faqs-and-known-issues' ? 3 : 2
      let processedTitle = title
      switch (slug) {
        case 'faqs-and-known-issues':
          processedTitle = 'FAQs'
          break
        case 'adding-new-posts':
          processedTitle = 'New Posts'
          break
        case 'recreating-current-pages':
          processedTitle = 'Current Pages'
          break
        case 'customizing-github-activity-pages':
          processedTitle = 'GitHub Activity'
          break
        case 'markdown-mdx-extended-features':
          processedTitle = 'Extended Features'
          break
        case 'managing-image-assets':
          processedTitle = 'Asset Management'
          break
        case 'about-open-graph-images':
          processedTitle = 'Open Graph'
          break
      }

      const itemCards = headings
        .filter(
          (h) => h.depth === neededHeadingLevel && h.text !== 'Wrapping Up'
        )
        .map((h) => ({
          link: `${basePath}${slug}/#${h.slug}`,
          text: `${processedTitle}: ${h.text}`,
          date: date,
        }))

      cards.push(...itemCards)
    }
  }

  return cards
}
