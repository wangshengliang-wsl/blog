import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import unocss from 'unocss/astro'
import astroExpressiveCode from 'astro-expressive-code'
import mdx from '@astrojs/mdx'

import { remarkPlugins, rehypePlugins } from './plugins'
import { SITE } from './src/config'

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE.website,
  base: SITE.base,
  integrations: [
    sitemap(),
    robotsTxt(),
    unocss({ injectReset: true }),
    astroExpressiveCode(),
    mdx(),
  ],
  markdown: {
    syntaxHighlight: false,
    remarkPlugins,
    rehypePlugins,
  },
  image: {
    domains: SITE.imageDomains,
    // https://docs.astro.build/en/guides/images/#responsive-image-behavior
    // Used for all local (except `/public`) and authorized remote images using `![]()` syntax; not configurable per-image
    // Used for all `<Image />` and `<Picture />` components unless overridden with `layout` prop
    layout: 'constrained',
    responsiveStyles: true,
  },
  // 优化预加载策略
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
  vite: {
    server: {
      allowedHosts: ['blog.local', '.localcan.dev'],
      headers: {
        // Enable CORS for dev: allow Giscus iframe to load local styles
        'Access-Control-Allow-Origin': '*',
      },
      // Increase timeout for large MDX files
      watch: {
        usePolling: false,
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      // 优化代码分割
      rollupOptions: {
        output: {
          manualChunks: {
            // 将大型第三方库分离
            'vendor-three': ['three'],
            'vendor-katex': ['katex'],
          },
        },
      },
    },
    // Optimize MDX processing
    optimizeDeps: {
      include: ['nprogress'],
      exclude: ['@astrojs/mdx'],
    },
  },
  // https://docs.astro.build/en/reference/experimental-flags/
  experimental: {
    contentIntellisense: true,
    preserveScriptOrder: true,
    headingIdCompat: true,
    chromeDevtoolsWorkspace: true,
    failOnPrerenderConflict: true,
  },
})
