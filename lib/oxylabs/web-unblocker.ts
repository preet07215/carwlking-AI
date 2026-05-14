/**
 * Oxylabs Web Unblocker — build proxy URLs for Hermes / tooling.
 * @see https://developers.oxylabs.io/proxies/web-unblocker
 *
 * Hermes Agent loads target pages with its own HTTP stack; set the same URLs on
 * the Hermes host as HTTP_PROXY / HTTPS_PROXY in ~/.hermes/.env (see scripts/print-hermes-oxylabs-env.mjs).
 */

const DEFAULT_HOST = "unblock.oxylabs.io"
const DEFAULT_PORT = 60000

function readTrim(key: string): string {
  const v = process.env[key]
  return typeof v === "string" ? v.trim() : ""
}

/** URL-encode userinfo for proxy URLs (handles ~, :, @ in passwords). */
function proxyAuthUrl(
  scheme: "http" | "https",
  username: string,
  password: string,
  host: string,
  port: number
): string {
  const u = encodeURIComponent(username)
  const p = encodeURIComponent(password)
  return `${scheme}://${u}:${p}@${host}:${port}`
}

export function isWebUnblockerConfigured(): boolean {
  const user = readTrim("OXYLABS_WEB_UNBLOCKER_USERNAME")
  const pass = readTrim("OXYLABS_WEB_UNBLOCKER_PASSWORD")
  return Boolean(user && pass)
}

export type WebUnblockerProxyUrls = {
  /** For requests library / many clients — HTTP target */
  http: string
  /** Oxylabs Python sample often uses https:// for the https key; both work for many stacks */
  https: string
  /**
   * Recommended for HTTP_PROXY / HTTPS_PROXY on Hermes (CONNECT tunnel).
   * Prefer this for BOTH env vars unless Oxylabs docs for your stack say otherwise.
   */
  forHermesHttpProxy: string
}

export function getWebUnblockerProxyUrls(): WebUnblockerProxyUrls | null {
  const username = readTrim("OXYLABS_WEB_UNBLOCKER_USERNAME")
  const password = readTrim("OXYLABS_WEB_UNBLOCKER_PASSWORD")
  if (!username || !password) return null

  const host = readTrim("OXYLABS_WEB_UNBLOCKER_HOST") || DEFAULT_HOST
  const portRaw = readTrim("OXYLABS_WEB_UNBLOCKER_PORT")
  const port = portRaw ? Number.parseInt(portRaw, 10) : DEFAULT_PORT
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("OXYLABS_WEB_UNBLOCKER_PORT must be a positive integer")
  }

  return {
    http: proxyAuthUrl("http", username, password, host, port),
    https: proxyAuthUrl("https", username, password, host, port),
    forHermesHttpProxy: proxyAuthUrl("http", username, password, host, port),
  }
}
