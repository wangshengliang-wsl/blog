import { getCollection, render } from 'astro:content'

import { resolvePath } from './path'

import type { CollectionEntry, CollectionKey } from 'astro:content'
import type { CardItemData } from '~/components/views/CardItem.astro'
import type { GitHubView } from '~/types'

const defaultCategory = '杂谈'

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
