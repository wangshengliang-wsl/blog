# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro 5-based blog built using the AntfuStyle theme. It's a feature-rich personal website with support for blog posts, project showcases, photo galleries, changelogs, and streams. The theme is inspired by antfu.me and includes zero-UI framework architecture with SEO optimization, RSS feeds, and dynamic OG image generation.

## Development Commands

```bash
# Development
pnpm dev              # Start dev server with auto-open in browser
pnpm sync             # Sync Astro content collections

# Build & Preview
pnpm build            # Build for production (includes pagefind index generation)
pnpm preview          # Preview production build locally

# Code Quality
pnpm check            # Run Astro type checking
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues automatically
pnpm format           # Check code formatting with Prettier
pnpm format:write     # Format code with Prettier

# Utilities
pnpm toolbar:on       # Enable Astro dev toolbar
pnpm toolbar:off      # Disable Astro dev toolbar
```

**Important**: This project uses `pnpm` as the package manager. Node version should be 18.20.8 or ^20.9.0 or ^22.0.0.

## Architecture & Structure

### Content Collections

Content is managed through Astro's Content Collections API (`src/content.config.ts`). Key collections:

- **blog**: Main blog posts (`src/content/blog/`)
- **changelog**: Development updates (`src/content/changelog/`)
- **projects**: Project data loaded from JSON (`src/content/projects/data.json`)
- **photos**: Photo gallery data from JSON (`src/content/photos/data.json`)
- **streams**: Stream data from JSON (`src/content/streams/data.json`)
- **releases**: GitHub releases loaded dynamically via `astro-loader-github-releases`
- **prs**: GitHub PRs loaded dynamically via `astro-loader-github-prs`
- **feeds**: External RSS feeds loaded via `@ascorbic/feed-loader`
- **pages**: MDX pages from `src/pages/`
- **home**: Homepage content

Each collection has a schema defined in `src/content/schema.ts`.

### Configuration System

The site is configured through `src/config.ts` which exports three main objects:

1. **SITE**: Basic site metadata (URL, title, author, language, allowed image domains)
2. **UI**: Navigation structure, social links, layout options, GitHub view settings
3. **FEATURES**: Feature toggles for TOC, OG images, search, Giscus comments, sharing, etc.

**Important**: When adding remote images, update `SITE.imageDomains` to enable image optimization.

### Markdown/MDX Processing

The site uses an extensive plugin system (`plugins/index.ts`):

**Remark plugins** (process Markdown AST):
- `remark-directive` + `remark-directive-sugar`: Custom directives for badges, links, images
- `remark-imgattr`: Image attributes support
- `remark-math`: Math equation support (KaTeX)
- `remark-reading-time`: Auto-calculate reading time (custom)
- `remark-generate-og-image`: Dynamic OG image generation (custom)

**Rehype plugins** (process HTML):
- `rehype-callouts`: VitePress-style callouts/admonitions
- `rehype-katex`: Render math equations
- `rehype-external-links`: Auto-handle external links (new tab icons)
- `rehype-autolink-headings`: Auto-generate heading anchor links
- `rehype-wrap-all`: Wrap tables in div containers

### Component Organization

```
src/components/
├── backgrounds/   # Animated background effects (plum, rose, dot, particle)
├── base/          # Core components (Head, Footer, Header, etc.)
├── nav/           # Navigation components
├── toc/           # Table of contents components
├── views/         # Content display views (GroupView, GithubView, etc.)
└── widgets/       # Reusable widgets (Comments, Search, Share, etc.)
```

### Layout System

Three main layouts in `src/layouts/`:

- **BaseLayout.astro**: Foundation layout with HTML structure, head tags, and view transitions
- **StandardLayout.astro**: Standard content pages with optional TOC
- **TabbedLayout.astro**: Tabbed interface for multi-view pages (changelog, feeds, streams)

### Utility Modules

Key utilities in `src/utils/`:

- **data.ts**: Content fetching, filtering, sorting, and pagination logic
- **datetime.ts**: Date formatting and manipulation
- **image.ts**: Image processing (OG images, optimization)
- **misc.ts**: General utilities (slugs, external links, etc.)
- **path.ts**: Path resolution and URL handling
- **toc.ts**: Table of contents generation

### Code Syntax Highlighting

Uses Astro Expressive Code with custom configuration (`ec.config.mjs`):
- Themes: vitesse-dark and vitesse-light
- Plugins: line numbers, collapsible sections
- Line wrapping disabled by default
- Custom fonts: DM Mono, Input Mono, Fira Code

### Search Functionality

Post-build search indexing via Pagefind:
- Indexes `blog` and `changelog` collections
- Excludes `<pre>` blocks from indexing
- UI components in `dist/pagefind/` (except UI files which are deleted)
- Search component: `src/components/widgets/Search.astro`

### Image Optimization

- Remote images: Must be in `SITE.imageDomains` for optimization
- Local images: Automatically optimized with responsive styles
- Layout: `constrained` with responsive styles enabled
- OG images: Generated dynamically with Satori using templates in `plugins/og-template/`

### Git Hooks

Pre-commit hooks configured via `simple-git-hooks`:
- Auto-runs `eslint --fix` on staged JS/TS/Astro files
- Auto-runs `prettier --write` on staged files

## Common Workflows

### Adding a New Blog Post

1. Create MDX/MD file in `src/content/blog/` or subdirectory
2. Add frontmatter with required fields: `title`, `description`, `publishDate`
3. Optional frontmatter: `tags`, `draft`, `image`, `lang`, `video`, `duration`
4. Run `pnpm sync` to update content collections
5. Build will auto-generate OG image if enabled in `FEATURES.ogImage`

### Modifying Navigation

Edit `UI.internalNavs` and `UI.socialLinks` in `src/config.ts`.

### Customizing Styles

- Global styles: `src/styles/global.css` and `src/styles/prose.css`
- UnoCSS configuration: `unocss.config.ts` (atomic CSS utilities)
- Component-specific styles: Within `.astro` component files

### Working with GitHub Loaders

GitHub loaders require `GITHUB_TOKEN` environment variable:
- Set in `.env` file for local development: `GITHUB_TOKEN=your_token`
- Set in CI/CD via `GH_TOKEN_FOR_LOADER` secret
- Configure repos in `src/content.config.ts` (releases, prs collections)
- Monorepos can be configured in `UI.githubView.monorepos`

## Deployment

### Vercel Deployment

Configuration in `vercel.json`:
- Build command: `pnpm build`
- Output directory: `dist`
- Framework: astro
- CORS headers configured for Giscus integration

### Important Build Notes

1. Search index is generated post-build via Pagefind
2. OG images are generated during build if enabled
3. GitHub loaders fetch data at build time (requires token)
4. Images are optimized during build (Sharp library)

## Type Safety

The project is fully TypeScript-enabled:
- Type definitions in `src/types.ts` (Site, UI, Features interfaces)
- Content schemas in `src/content/schema.ts`
- Run `pnpm check` to validate Astro types
- Run `pnpm lint` to check for TypeScript/ESLint issues
