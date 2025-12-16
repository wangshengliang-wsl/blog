import { glob, file } from 'astro/loaders'
import { defineCollection } from 'astro:content'

// import { feedLoader } from '@ascorbic/feed-loader'
// import { githubReleasesLoader } from 'astro-loader-github-releases'
// import { githubPrsLoader } from 'astro-loader-github-prs'

import {
  pageSchema,
  postSchema,
  projectSchema,
  streamSchema,
  photoSchema,
} from '~/content/schema'
import { cmsLoader } from '~/loaders/cms'
import { mediaLoader } from '~/loaders/cms/media'

// CMS API base URL from environment variable
const CMS_API_URL = import.meta.env.CMS_API_URL

const pages = defineCollection({
  loader: glob({ base: './src/pages', pattern: '**/*.mdx' }),
  schema: pageSchema,
})

const home = defineCollection({
  loader: glob({ base: './src/content/home', pattern: 'index.{md,mdx}' }),
})

// Use CMS loader if API URL is configured, otherwise use local files
const blog = defineCollection({
  loader: CMS_API_URL
    ? cmsLoader({ apiBaseUrl: CMS_API_URL })
    : glob({ base: './src/content/blog', pattern: '**/[^_]*.{md,mdx}' }),
  schema: postSchema,
})

const projects = defineCollection({
  loader: file('./src/content/projects/data.json'),
  schema: projectSchema,
})

// 注释掉需要 GitHub Token 的 loader，避免开发时报错
// const releases = defineCollection({
//   loader: githubReleasesLoader({
//     mode: 'repoList',
//     repos: [
//       'withastro/astro',
//       'withastro/starlight',
//       'lin-stephanie/astro-loaders',
//       'lin-stephanie/astro-antfustyle-theme',
//     ],
//     monthsBack: 2,
//     entryReturnType: 'byRelease',
//     clearStore: true,
//   }),
// })

// const prs = defineCollection({
//   loader: githubPrsLoader({
//     search:
//       'repo:withastro/astro repo:withastro/starlight repo:lin-stephanie/astro-antfustyle-theme',
//     monthsBack: 1,
//     clearStore: true,
//   }),
// })

// Use CMS media loader if API URL is configured, otherwise use local files
const photos = defineCollection({
  loader: CMS_API_URL
    ? mediaLoader({ apiBaseUrl: CMS_API_URL })
    : file('src/content/photos/data.json'),
  schema: photoSchema,
})

const changelog = defineCollection({
  loader: glob({
    base: './src/content/changelog',
    pattern: '**/[^_]*.{md,mdx}',
  }),
  schema: postSchema,
})

const streams = defineCollection({
  loader: file('./src/content/streams/data.json'),
  schema: streamSchema,
})

// 注释掉需要网络请求的 loader，避免开发时网络超时报错
// const feeds = defineCollection({
//   loader: feedLoader({
//     url: 'https://astro.build/rss.xml',
//   }),
// })

export const collections = {
  pages,
  home,
  blog,
  projects,
  // releases,
  // prs,
  photos,
  changelog,
  streams,
  // feeds,
}
