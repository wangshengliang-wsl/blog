import type { Loader } from 'astro/loaders'

/**
 * CMS Media response types
 */
export interface CMSMedia {
  id: string
  url: string
  name: string
  type: string
  size: number
  createdAt: string
}

export interface CMSMediaResponse {
  photos: CMSMedia[]
  total: number
  limit: number
  offset: number
}

export interface MediaLoaderOptions {
  apiBaseUrl: string
  batchSize?: number
}

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const waitTime = retryDelay * attempt
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries')
}

/**
 * Astro loader for fetching media from CMS API
 * Transforms CMS media data to match the blog's photoSchema
 */
export function mediaLoader(options: MediaLoaderOptions): Loader {
  // Use larger batch size - media items are smaller than posts
  const { apiBaseUrl, batchSize = 500 } = options

  return {
    name: 'cms-media-loader',
    load: async ({ store, logger, parseData }) => {
      logger.info('Fetching media from CMS...')

      try {
        // Clear existing entries
        store.clear()

        // Fetch all media in one request (usually small number)
        const mediaUrl = `${apiBaseUrl}/api/public/media?limit=${batchSize}&offset=0&type=image`

        let response: Response
        try {
          response = await fetchWithRetry(mediaUrl, {
            headers: {
              Accept: 'application/json',
            },
          })
        } catch (fetchError) {
          const errorMessage =
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError)
          logger.error(`Fetch error: ${errorMessage}`)
          throw new Error(
            `Failed to fetch media from ${mediaUrl}. Error: ${errorMessage}`
          )
        }

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Failed to fetch media from ${mediaUrl}`
          )
        }

        const data: CMSMediaResponse = await response.json()
        let totalFetched = 0

        // Process each media item
        for (const item of data.photos) {
          try {
            // Transform CMS media to photo schema format
            const entry = {
              id: item.url,
              data: {
                id: item.url,
                desc: item.name.replace(/\.[^/.]+$/, ''),
              },
            }

            // Parse and validate data against schema
            const parsedData = await parseData({
              id: entry.id,
              data: entry.data,
            })

            // Store the entry
            store.set({
              id: entry.id,
              data: parsedData,
            })

            totalFetched++
          } catch (err) {
            logger.error(`Error processing media ${item.id}: ${err}`)
          }
        }

        // Handle pagination if needed (for very large media libraries)
        if (data.total > batchSize) {
          let offset = batchSize
          while (offset < data.total) {
            const nextUrl = `${apiBaseUrl}/api/public/media?limit=${batchSize}&offset=${offset}&type=image`
            const nextResponse = await fetchWithRetry(nextUrl, {
              headers: { Accept: 'application/json' },
            })

            if (nextResponse.ok) {
              const nextData: CMSMediaResponse = await nextResponse.json()
              for (const item of nextData.photos) {
                try {
                  const entry = {
                    id: item.url,
                    data: {
                      id: item.url,
                      desc: item.name.replace(/\.[^/.]+$/, ''),
                    },
                  }
                  const parsedData = await parseData({
                    id: entry.id,
                    data: entry.data,
                  })
                  store.set({ id: entry.id, data: parsedData })
                  totalFetched++
                } catch (err) {
                  logger.error(`Error processing media ${item.id}: ${err}`)
                }
              }
            }
            offset += batchSize
          }
        }

        logger.info(`Successfully loaded ${totalFetched} media items from CMS`)
      } catch (err) {
        logger.error(`CMS media loader error: ${err}`)
        throw err
      }
    },
  }
}
