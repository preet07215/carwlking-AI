/**
 * Oxylabs Web Unblocker proxy URLs for Hermes to apply when crawling (e.g. after 403).
 * Sent as custom HTTP headers on each `/v1/chat/completions` request when the user enables proxy.
 *
 * Hermes must forward or consume these (or equivalent) headers for your deployment—names are stable
 * for this app so you can map them in gateway middleware.
 */
const DEFAULT_HOST = "unblock.oxylabs.io:60000"

export const OXYLABS_HERMES_HEADER_HTTP = "X-Oxylabs-Web-Unblocker-Http" as const
export const OXYLABS_HERMES_HEADER_HTTPS = "X-Oxylabs-Web-Unblocker-Https" as const

/** Returns header pairs if env credentials are set; otherwise null. */
export function getOxylabsWebUnblockerHeaderPairs():
  | Record<typeof OXYLABS_HERMES_HEADER_HTTP | typeof OXYLABS_HERMES_HEADER_HTTPS, string>
  | null {
  const user = process.env.OXYLABS_WEB_UNBLOCKER_USERNAME?.trim()
  const pass = process.env.OXYLABS_WEB_UNBLOCKER_PASSWORD?.trim()
  if (!user || !pass) return null

  const host = (process.env.OXYLABS_WEB_UNBLOCKER_HOST ?? DEFAULT_HOST).replace(
    /^https?:\/\//,
    ""
  )

  const u = encodeURIComponent(user)
  const p = encodeURIComponent(pass)
  const http = `http://${u}:${p}@${host}`
  const https = `https://${u}:${p}@${host}`

  return {
    [OXYLABS_HERMES_HEADER_HTTP]: http,
    [OXYLABS_HERMES_HEADER_HTTPS]: https,
  }
}
