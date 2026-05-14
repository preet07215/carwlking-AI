#!/usr/bin/env node
/**
 * Reads OXYLABS_* from .env.local / .env and prints lines to paste into ~/.hermes/.env
 * so Hermes tool HTTP uses Oxylabs Web Unblocker (same idea as requests + proxies).
 */
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

function loadEnvFiles() {
  const root = process.cwd()
  for (const name of [".env.local", ".env"]) {
    const p = join(root, name)
    if (!existsSync(p)) continue
    const text = readFileSync(p, "utf8")
    for (const line of text.split("\n")) {
      const t = line.trim()
      if (!t || t.startsWith("#")) continue
      const eq = t.indexOf("=")
      if (eq <= 0) continue
      const key = t.slice(0, eq).trim()
      let val = t.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
  }
}

loadEnvFiles()

const user = (process.env.OXYLABS_WEB_UNBLOCKER_USERNAME || "").trim()
const pass = (process.env.OXYLABS_WEB_UNBLOCKER_PASSWORD || "").trim()
const host = (
  process.env.OXYLABS_WEB_UNBLOCKER_HOST || "unblock.oxylabs.io"
).trim()
const port = (
  process.env.OXYLABS_WEB_UNBLOCKER_PORT || "60000"
).trim()

if (!user || !pass) {
  console.error(
    "Set OXYLABS_WEB_UNBLOCKER_USERNAME and OXYLABS_WEB_UNBLOCKER_PASSWORD in .env.local first."
  )
  process.exit(1)
}

const enc = encodeURIComponent
const proxyHttp = `http://${enc(user)}:${enc(pass)}@${host}:${port}`

console.log(
  `
# --- Paste into ~/.hermes/.env, then restart: hermes gateway
NO_PROXY=127.0.0.1,localhost,::1
HTTP_PROXY=${proxyHttp}
HTTPS_PROXY=${proxyHttp}
`.trim()
)
