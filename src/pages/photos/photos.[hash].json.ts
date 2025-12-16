import crypto from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { getCollection } from 'astro:content'
import { shorthash } from 'astro/runtime/server/shorthash.js'

import {
  fetchRemoteImageWithSharp,
  generatePlaceholder,
  getThumbnail,
} from '~/utils/image'

import type { APIRoute } from 'astro'

const CACHE_PATH = './node_modules/.astro/photos/'
const PLACEHOLDER_PIXEL_TARGET = 100
// balance high pixel density and file size
const THUMBNAIL_WIDTH = 720

// Default placeholder for failed remote images (1x1 gray pixel)
const DEFAULT_PLACEHOLDER =
  'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADQAQCdASoKAAoAAUAmJYgCdAEO/hOMAAD++O9P/t2tj/lf6nqPZv/V9l36n9W+tf+J7AH7lfYx+wH/APYA/qN9hP7Q/YD/acAAAA=='
const DEFAULT_ASPECT_RATIO = 4 / 3

export interface PhotoItem {
  uuid: string
  src: string
  desc: string
  thumbnail: string
  placeholder: string
  aspectRatio: number
}

const VERSION = 1
const isDev = import.meta.env.DEV

// Get photos metadata synchronously (fast operation, just collection lookup)
const photos = (await getCollection('photos')).map((p) => ({
  id: p.data.id,
  desc: p.data.desc,
}))

// Compute hash synchronously - this is fast (just hashing metadata)
export const hash = crypto
  .createHash('sha256')
  .update(`${VERSION}-${JSON.stringify(photos)}`)
  .digest('hex')
  .slice(0, 8)

// Lazy initialization for heavy image processing
let _data: PhotoItem[] | null = null
let _dataPromise: Promise<PhotoItem[]> | null = null

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/photos/**/*.{jpg,jpeg,png,webp,avif}'
)

async function processPhotos(): Promise<PhotoItem[]> {
  // Return cached data if available
  if (_data !== null) {
    return _data
  }

  // Return existing promise if processing is in progress
  if (_dataPromise !== null) {
    return _dataPromise
  }

  // Start processing
  _dataPromise = (async () => {
    const data: PhotoItem[] = []
    const localImageKeys = Object.keys(localImages)

    // Process photos sequentially to avoid overwhelming the system
    for (const photo of photos) {
      const { id, desc } = photo

      // remote image
      if (id.startsWith('http://') || id.startsWith('https://')) {
        const uuid = shorthash(id + PLACEHOLDER_PIXEL_TARGET)

        // try to load from cache first
        try {
          const cache = JSON.parse(readFileSync(CACHE_PATH + uuid, 'utf-8'))
          data.push({
            uuid,
            src: id,
            desc,
            thumbnail: id,
            placeholder: cache.placeholder,
            aspectRatio: cache.aspectRatio,
          })
          continue
        } catch (_) {
          // ignore cache miss
        }

        // In dev mode, skip fetching remote images to avoid timeout
        // Use default placeholder instead
        if (isDev) {
          data.push({
            uuid,
            src: id,
            desc,
            thumbnail: id,
            placeholder: DEFAULT_PLACEHOLDER,
            aspectRatio: DEFAULT_ASPECT_RATIO,
          })
          continue
        }

        // In build mode, fetch and process remote images
        try {
          const remoteImage = await fetchRemoteImageWithSharp(id, {
            timeoutMs: 60000,
          })
          if (!remoteImage.isImage) {
            console.warn(
              `[photos.${hash}.json.ts] Skipping invalid image: ${id}`
            )
            // Still add with default placeholder
            data.push({
              uuid,
              src: id,
              desc,
              thumbnail: id,
              placeholder: DEFAULT_PLACEHOLDER,
              aspectRatio: DEFAULT_ASPECT_RATIO,
            })
            continue
          }
          const placeholder = await generatePlaceholder(
            remoteImage.data,
            remoteImage.width,
            remoteImage.height,
            PLACEHOLDER_PIXEL_TARGET
          )

          const aspectRatio = remoteImage.width / remoteImage.height

          data.push({
            uuid,
            src: id,
            desc,
            thumbnail: id,
            placeholder,
            aspectRatio,
          })

          // save to cache
          mkdirSync(CACHE_PATH, { recursive: true })
          writeFileSync(
            CACHE_PATH + uuid,
            JSON.stringify({ placeholder, aspectRatio })
          )
        } catch (err) {
          console.warn(
            `[photos.${hash}.json.ts] Error processing remote image ${id}:`,
            err
          )
          // Add with default placeholder on error
          data.push({
            uuid,
            src: id,
            desc,
            thumbnail: id,
            placeholder: DEFAULT_PLACEHOLDER,
            aspectRatio: DEFAULT_ASPECT_RATIO,
          })
        }

        continue
      }

      // local image
      const localImagePath = localImageKeys.find((path) => path.includes(id))
      if (!localImagePath) {
        console.warn(`[photos.${hash}.json.ts] Skipping invalid image: ${id}`)
        continue
      }

      // try to load from cache first
      const localImage = (await localImages[localImagePath]()).default
      const uuid = shorthash(
        id + PLACEHOLDER_PIXEL_TARGET + localImage.width + localImage.height
      )
      try {
        const cache = JSON.parse(readFileSync(CACHE_PATH + uuid, 'utf-8'))
        const thumbnail = await getThumbnail(
          localImage,
          THUMBNAIL_WIDTH,
          cache.aspectRatio
        )
        data.push({
          uuid,
          src: localImage.src,
          desc,
          thumbnail,
          placeholder: cache.placeholder,
          aspectRatio: cache.aspectRatio,
        })
        continue
      } catch (_) {
        // ignore cache miss
      }

      // get placeholder
      const localImageBuffer = readFileSync(
        (
          localImage as ImageMetadata & {
            fsPath: string
          }
        ).fsPath
      )
      const placeholder = await generatePlaceholder(
        localImageBuffer,
        localImage.width,
        localImage.height,
        PLACEHOLDER_PIXEL_TARGET
      )

      // get thumbnail
      const aspectRatio = localImage.width / localImage.height
      const thumbnail = await getThumbnail(
        localImage,
        THUMBNAIL_WIDTH,
        aspectRatio
      )

      data.push({
        uuid,
        src: localImage.src,
        desc,
        thumbnail,
        placeholder,
        aspectRatio,
      })

      // save to cache
      mkdirSync(CACHE_PATH, { recursive: true })
      writeFileSync(
        CACHE_PATH + uuid,
        JSON.stringify({ placeholder, aspectRatio })
      )
    }

    _data = data
    return data
  })()

  return _dataPromise
}

export const GET: APIRoute = async () => {
  const data = await processPhotos()
  return new Response(JSON.stringify([hash, data]), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

export async function getStaticPaths() {
  return [{ params: { hash } }]
}
