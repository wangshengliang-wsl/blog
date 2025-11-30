#!/bin/bash
# Build script with increased memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
exec astro build "$@"

