#!/bin/bash
export NODE_OPTIONS='--max-old-space-size=12288'
exec astro build "$@"
