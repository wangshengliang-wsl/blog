import {
  defineConfig,
  presetWind3,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { readFileSync, existsSync } from 'node:fs'

import { UI } from './src/config'
import projecstData from './src/content/projects/data.json'

import type {
  IconNavItem,
  ResponsiveNavItem,
  IconSocialItem,
  ResponsiveSocialItem,
} from './src/types'

const { internalNavs, socialLinks, githubView } = UI
const navIcons = internalNavs
  .filter(
    (item) =>
      item.displayMode !== 'alwaysText' &&
      item.displayMode !== 'textHiddenOnMobile'
  )
  .map((item) => (item as IconNavItem | ResponsiveNavItem).icon)
const socialIcons = socialLinks
  .filter(
    (item) =>
      item.displayMode !== 'alwaysText' &&
      item.displayMode !== 'textHiddenOnMobile'
  )
  .map((item) => (item as IconSocialItem | ResponsiveSocialItem).icon)

const projectIcons = projecstData.map((item) => item.icon)

/**
 * 从缓存文件加载博客图标
 * 缓存由 scripts/extract-icons.js 在构建前生成
 */
function getBlogIcons(): string[] {
  const cacheFile = './.cache/blog-icons.json'
  try {
    if (existsSync(cacheFile)) {
      return JSON.parse(readFileSync(cacheFile, 'utf-8'))
    }
  } catch (_e) {
    console.warn('[unocss] Failed to load blog icons cache, using empty array')
  }
  return []
}

const blogIcons = getBlogIcons()

const githubVersionColor: Record<string, string> = {
  major: 'bg-rose/15 text-rose-7 dark:text-rose-3',
  minor: 'bg-purple/15 text-purple-7 dark:text-purple-3',
  patch: 'bg-green/15 text-green-7 dark:text-green-3',
  pre: 'bg-teal/15 text-teal-7 dark:text-teal-3',
}
const githubVersionClass = Object.keys(githubVersionColor).map(
  (k) => `github-${k}`
)
const githubSubLogos = githubView.subLogoMatches.map((item) => item[1])

export default defineConfig({
  // Astro 5 no longer pipes `src/content/**/*.{md,mdx}` through Vite
  content: {
    filesystem: ['./src/{content,pages}/**/*.{md,mdx}'],
  },

  // will be deep-merged to the default theme
  extendTheme: (theme) => {
    return {
      ...theme,
      breakpoints: {
        ...theme.breakpoints,
        lgp: '1128px',
      },
    }
  },

  // define utility classes and the resulting CSS
  rules: [],

  // combine multiple rules as utility classes
  shortcuts: [
    [
      /^(\w+)-transition(?:-(\d+))?$/,
      (match) =>
        `transition-${match[1] === 'op' ? 'opacity' : match[1]} duration-${match[2] ? match[2] : '300'} ease-in-out`,
    ],
    [
      /^shadow-custom_(-?\d+)_(-?\d+)_(-?\d+)_(-?\d+)$/,
      ([_, x, y, blur, spread]) =>
        `shadow-[${x}px_${y}px_${blur}px_${spread}px_rgba(0,0,0,0.2)] dark:shadow-[${x}px_${y}px_${blur}px_${spread}px_rgba(255,255,255,0.25)]`,
    ],
    [
      /^btn-(\w+)$/,
      ([_, color]) => {
        // 使用明确的颜色类名，避免动态构建导致的警告
        const colorMap: Record<string, string> = {
          primary: 'blue',
          secondary: 'gray',
          success: 'green',
          warning: 'yellow',
          danger: 'red',
          info: 'cyan',
          orange: 'orange',
          violet: 'violet',
          purple: 'purple',
          pink: 'pink',
          indigo: 'indigo',
          cancel: 'gray',
          confirm: 'blue',
        }
        const mappedColor = colorMap[color] || color
        return `px-2.5 py-1 border border-[#8884]! rounded op-50 transition-all duration-200 ease-out no-underline! hover:op-100 hover:text-${mappedColor} hover:bg-${mappedColor}/10`
      },
    ],
    [
      /^github-(major|minor|patch|pre)$/,
      ([, version]) => `rounded ${githubVersionColor[version]}`,
    ],
  ],

  // presets are partial configurations
  presets: [
    presetWind3(),
    presetAttributify({
      strict: true,
      prefix: 'u-',
      prefixedOnly: false,
    }),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'height': '1.2em',
        'width': '1.2em',
        'vertical-align': 'text-bottom',
      },
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,600,800',
        mono: 'DM Mono:400,600',
        condensed: 'Roboto Condensed',
      },
      provider: 'google',
      timeouts: {
        warning: 8000, // 警告超时时间 8 秒
        failure: 15000, // 失败超时时间 15 秒
      },
    }),
  ],

  // provides a unified interface to transform source code in order to support conventions
  transformers: [transformerDirectives(), transformerVariantGroup()],

  // work around the limitation of dynamically constructed utilities
  // https://unocss.dev/guide/extracting#limitations
  safelist: [
    ...navIcons,
    ...socialIcons,
    ...projectIcons,
    ...blogIcons,

    /* BaseLayout */
    'focus:not-sr-only',
    'focus:fixed',
    'focus:start-1',
    'focus:top-1.5',
    'focus:op-20',

    /* GithubItem */
    ...githubVersionClass,
    ...githubSubLogos,

    /* Toc */
    'i-ri-menu-2-fill',
    'i-ri-menu-3-fill',

    /* Nav Panel */
    'i-ri-close-line',
    'i-ri-menu-line',

    /* Music Player */
    'i-ri-disc-line',
    'i-ri-album-line',
    'i-ri-music-2-line',
    'i-ri-search-line',
    'i-ri-search-eye-line',
    'i-ri-arrow-left-s-line',
    'i-ri-play-circle-fill',
    'i-ri-volume-down-line',
    'i-ri-volume-up-line',
    'i-ri-information-line',
    'i-ri-add-circle-line',
    'i-ri-list-unordered',
    'i-ri-hand-coin-line',
    'i-ri-sound-module-line',

    /* btn-* shortcuts - 添加常用的颜色组合到 safelist */
    'hover:text-primary',
    'hover:bg-primary/10',
    'hover:text-blue',
    'hover:bg-blue/10',
    'hover:text-gray',
    'hover:bg-gray/10',
    'hover:text-green',
    'hover:bg-green/10',
    'hover:text-yellow',
    'hover:bg-yellow/10',
    'hover:text-red',
    'hover:bg-red/10',
    'hover:text-cyan',
    'hover:bg-cyan/10',
    'hover:text-orange',
    'hover:bg-orange/10',
    'hover:text-violet',
    'hover:bg-violet/10',
    'hover:text-purple',
    'hover:bg-purple/10',
    'hover:text-pink',
    'hover:bg-pink/10',
    'hover:text-indigo',
    'hover:bg-indigo/10',
    'hover:text-cancel',
    'hover:bg-cancel/10',
    'hover:text-confirm',
    'hover:bg-confirm/10',
  ],
})
