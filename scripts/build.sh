#!/bin/bash
# Use environment variable if set, otherwise use a reasonable default
# Local builds can use more memory; Vercel/CI can override via env var
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
exec astro build "$@"
