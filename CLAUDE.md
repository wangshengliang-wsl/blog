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

### CMS Integration

博客支持两种内容来源模式（通过环境变量 `CMS_API_URL` 切换）：

| 模式 | 配置 | 内容来源 |
|------|------|---------|
| CMS模式 | `CMS_API_URL` 已设置 | 从 blog-cms API 获取 |
| 本地模式 | `CMS_API_URL` 未设置 | 本地 `src/content/blog/` |

#### CMS相关文件
- `src/loaders/cms/` - CMS内容加载器
- `src/utils/cms-api.ts` - CMS API客户端
- `src/content.config.ts` - 内容集合配置（自动切换加载方式）

#### CMS API端点
```
GET /api/public/posts         # 获取文章列表
GET /api/public/posts/:slug   # 获取单篇文章
GET /api/public/categories    # 获取分类列表
GET /api/public/tags          # 获取标签列表
```

#### CMS项目
- 路径: `/Users/wangshengliang/Desktop/i/blog-cms`
- 技术栈: Next.js 15, Turso (SQLite), Drizzle ORM
- 部署: Cloudflare Pages (`https://main.blog-cms-1j0.pages.dev`)

### Content Collections (`src/content/`)

| Collection | Format | Purpose |
|------------|--------|---------|
| `blog/` | MDX in category folders (or CMS) | Blog posts |
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
