import { getHermesServerConfig } from "@/lib/hermes/config"
import {
  formatHermesConnectionHelp,
  isLikelyConnectionFailure,
} from "@/lib/hermes/errors"

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const

export class HermesUpstreamError extends Error {
  status: number
  body: string

  constructor(message: string, status: number, body: string) {
    super(message)
    this.name = "HermesUpstreamError"
    this.status = status
    this.body = body
  }
}

async function hermesAuthFetch(
  path: string,
  init?: RequestInit & {
    skipJsonContentType?: boolean
    extraHeaders?: Record<string, string>
  }
): Promise<Response> {
  const { apiV1, origin, apiKey } = getHermesServerConfig()
  const url = path.startsWith("http")
    ? path
    : path.startsWith("/v1/")
      ? `${origin}${path}`
      : `${apiV1}${path.startsWith("/") ? path : `/${path}`}`

  const headers = new Headers(init?.headers)
  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`)
  }
  if (init?.extraHeaders) {
    for (const [k, v] of Object.entries(init.extraHeaders)) {
      headers.set(k, v)
    }
  }
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !init.skipJsonContentType
  ) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  }

  try {
    const { extraHeaders, skipJsonContentType, ...rest } = init ?? {}
    void extraHeaders
    void skipJsonContentType
    return await fetch(url, { ...rest, headers })
  } catch (err) {
    if (isLikelyConnectionFailure(err)) {
      const { error, hint, code } = formatHermesConnectionHelp(err, url)
      const e = new Error(error)
      ;(e as Error & { hint?: string; code?: string; cause?: unknown }).hint =
        hint
      if (code) {
        ;(e as Error & { code?: string }).code = code
      }
      ;(e as Error & { cause?: unknown }).cause = err
      throw e
    }
    throw err
  }
}

export async function hermesHealth(): Promise<unknown> {
  const { origin, apiV1 } = getHermesServerConfig()

  let res: Response | null = null
  try {
    res = await hermesAuthFetch(`${origin}/health`, {
      method: "GET",
      skipJsonContentType: true,
    })
  } catch {
    res = null
  }

  if (res?.ok) {
    return res.json() as Promise<unknown>
  }

  res = await hermesAuthFetch(`${apiV1}/health`, {
    method: "GET",
    skipJsonContentType: true,
  })

  if (!res.ok) {
    const t = await res.text()
    throw new HermesUpstreamError("Health check failed", res.status, t)
  }
  return res.json() as Promise<unknown>
}

export async function hermesModels(): Promise<unknown> {
  const res = await hermesAuthFetch("/models", { method: "GET" })
  if (!res.ok) {
    const t = await res.text()
    throw new HermesUpstreamError("Models list failed", res.status, t)
  }
  return res.json() as Promise<unknown>
}

export async function hermesCapabilities(): Promise<unknown> {
  const res = await hermesAuthFetch("/capabilities", { method: "GET" })
  if (!res.ok) {
    const t = await res.text()
    throw new HermesUpstreamError("Capabilities failed", res.status, t)
  }
  return res.json() as Promise<unknown>
}

/** OpenAI chat.completions non-streaming */
export async function hermesChatCompletion(
  body: Record<string, unknown>,
  options?: { extraHeaders?: Record<string, string> }
): Promise<unknown> {
  const res = await hermesAuthFetch("/chat/completions", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
    extraHeaders: options?.extraHeaders,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new HermesUpstreamError("Chat completion failed", res.status, text)
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new HermesUpstreamError("Invalid JSON from Hermes", res.status, text)
  }
}

/** Raw passthrough (still server-side; use from API routes only) */
export async function hermesPostJson(
  path: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const res = await hermesAuthFetch(path, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) {
    throw new HermesUpstreamError(`POST ${path} failed`, res.status, text)
  }
  try {
    return text ? (JSON.parse(text) as unknown) : {}
  } catch {
    throw new HermesUpstreamError("Invalid JSON from Hermes", res.status, text)
  }
}
