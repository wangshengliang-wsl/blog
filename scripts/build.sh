#!/bin/bash
# Build script with optimized memory limit for Node.js

# 提高内存上限，避免大规模内容构建 OOM（约 14GB）
export NODE_OPTIONS="--max-old-space-size=14336"

# 提取并缓存博客图标（避免 UnoCSS 每次重新扫描）
echo "==> Extracting blog icons..."
node scripts/extract-icons.js

# 执行 Astro 构建
echo "==> Building Astro site..."
exec astro build "$@"

