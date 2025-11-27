# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal technical blog built with **Astro 5** (AntfuStyle theme). Chinese language (zh-Hans), deployed to https://wangshengliang.cn/.

## Commands

```bash
pnpm dev              # Start dev server (auto-opens browser)
pnpm build            # Production build (./scripts/build.sh with NODE_OPTIONS for memory)
pnpm check            # Astro TypeScript checking
pnpm sync             # Sync Astro content schema
pnpm lint             # ESLint with cache
pnpm lint:fix         # Fix ESLint issues
pnpm format:write     # Apply Prettier formatting
pnpm preview          # Preview production build
```

## Architecture

### Tech Stack
- **Astro 5** with MDX for content
- **TypeScript** strict mode, path alias `~/*` → `./src/*`
- **UnoCSS** (Wind3 preset) for styling
- **Expressive Code** for syntax highlighting

### Content Collections (`src/content/`)

| Collection | Format | Purpose |
|------------|--------|---------|
| `blog/` | MDX in category folders | Blog posts |
| `changelog/` | MDX | Site updates |
| `projects/` | JSON | Projects data |
| `photos/` | JSON | Gallery data |
| `streams/` | JSON | External links |

### Post Frontmatter

Required:
```yaml
title: "Post Title"    # Max 60 chars
pubDate: 2024-01-15    # YYYY-MM-DD
category: "ES6+"       # Maps to folder in blog/
```

Optional: `description`, `subtitle`, `titleIcon`, `tags`, `draft`, `toc`, `ogImage`

### Key Files
- `src/config.ts` - Site settings (SITE, UI, FEATURES)
- `src/content/schema.ts` - Zod validation schemas
- `plugins/` - Custom Remark/Rehype plugins including OG image generation

### Features
- **Search**: Pagefind (postbuild step)
- **Comments**: Giscus (GitHub-based)
- **Math**: KaTeX via rehype-katex
- **Backgrounds**: Animated options (Plum, Dot, Rose, Particle)

## Code Style

- ESLint 9 flat config + Prettier (single quotes, 80 char width)
- Pre-commit hooks via simple-git-hooks + lint-staged
- Unused variables must use `_` prefix

## Blog Writing

See `/docs/prompt.md` for Chinese technical blog guidelines:
- Example-driven with runnable code
- Version/environment annotations required
- Avoid AI-like phrasing
