#!/bin/bash
# Use environment variable if set, otherwise use a reasonable default
# Vercel has ~4GB memory, so 4096MB is safer
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
exec astro build "$@"
