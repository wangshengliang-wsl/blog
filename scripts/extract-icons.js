#!/usr/bin/env node
/**
 * 提取博客文章中的图标并缓存
 * 避免每次构建都重新扫描所有 MDX 文件
 */

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')
const BLOG_DIR = join(ROOT_DIR, 'src/content/blog')
const CACHE_DIR = join(ROOT_DIR, '.cache')
const CACHE_FILE = join(CACHE_DIR, 'blog-icons.json')
const HASH_FILE = join(CACHE_DIR, 'blog-icons.hash')

/**
 * 计算目录的哈希值（基于文件修改时间）
 */
function getDirHash(dir) {
  const files = []

  function walk(currentDir) {
    try {
      const entries = readdirSync(currentDir)
      for (const entry of entries) {
        const fullPath = join(currentDir, entry)
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath)
        } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
          files.push(`${fullPath}:${stat.mtimeMs}`)
        }
      }
    } catch (_e) {
      // Ignore errors
    }
  }

  walk(dir)
  return createHash('md5').update(files.sort().join('\n')).digest('hex')
}

/**
 * 从文件中提取图标
 */
function extractIconFromFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1]
      const iconMatch = frontmatter.match(/titleIcon:\s*(.+)/)
      if (iconMatch) {
        const icon = iconMatch[1].trim().replace(/["']/g, '')
        // Skip URL format icons
        if (!/^https?:\/\//.test(icon)) {
          return icon.startsWith('i-') ? icon : `i-${icon}`
        }
      }
    }
  } catch (_e) {
    // Ignore errors
  }
  return null
}

/**
 * 扫描博客目录获取所有图标
 */
function scanBlogIcons(dir) {
  const icons = new Set()

  function walk(currentDir) {
    try {
      const entries = readdirSync(currentDir)
      for (const entry of entries) {
        const fullPath = join(currentDir, entry)
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath)
        } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
          const icon = extractIconFromFile(fullPath)
          if (icon) icons.add(icon)
        }
      }
    } catch (_e) {
      // Ignore errors
    }
  }

  walk(dir)
  return Array.from(icons)
}

/**
 * 主函数：检查缓存并在需要时更新
 */
function main() {
  // 确保缓存目录存在
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true })
  }

  // 检查博客目录是否存在
  if (!existsSync(BLOG_DIR)) {
    console.log(
      '[extract-icons] Blog directory not found, creating empty cache'
    )
    writeFileSync(CACHE_FILE, JSON.stringify([]))
    return []
  }

  // 计算当前哈希
  const currentHash = getDirHash(BLOG_DIR)

  // 检查缓存是否有效
  let cachedHash = ''
  try {
    cachedHash = readFileSync(HASH_FILE, 'utf-8').trim()
  } catch (_e) {
    // No cache
  }

  if (cachedHash === currentHash && existsSync(CACHE_FILE)) {
    console.log('[extract-icons] Using cached icons')
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
  }

  // 重新扫描
  console.log('[extract-icons] Scanning blog icons...')
  const startTime = Date.now()
  const icons = scanBlogIcons(BLOG_DIR)
  const duration = Date.now() - startTime

  // 保存缓存
  writeFileSync(CACHE_FILE, JSON.stringify(icons, null, 2))
  writeFileSync(HASH_FILE, currentHash)

  console.log(`[extract-icons] Found ${icons.length} icons in ${duration}ms`)
  return icons
}

// 如果直接运行脚本
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const icons = main()
  console.log('[extract-icons] Icons:', icons)
}

export { main as extractBlogIcons }
