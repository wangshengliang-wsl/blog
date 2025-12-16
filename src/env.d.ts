import '../.astro/types.d.ts'

// https://unocss.dev/presets/attributify#typescript-support-jsx-tsx
import type {
  AttributifyAttributes,
  AttributifyNames,
} from 'unocss/preset-attributify'

type Prefix = 'u-' // change it to your prefix

declare global {
  namespace astroHTML.JSX {
    interface HTMLAttributes
      extends AttributifyAttributes,
        Partial<Record<AttributifyNames<Prefix>, string>> {}
  }
}

// Environment variables type declaration
interface ImportMetaEnv {
  /**
   * CMS API base URL for fetching blog posts
   * @example 'https://cms.example.com'
   */
  readonly CMS_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
