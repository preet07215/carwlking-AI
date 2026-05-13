import { getHermesServerConfig } from "@/lib/hermes/config"

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
  init?: RequestInit & { skipJsonContentType?: boolean }
): Promise<Response> {
  const { apiV1, origin, apiKey } = getHermesServerConfig()
  const url = path.startsWith("http")
    ? path
    : path.startsWith("/v1/")
      ? `${origin}${path}`
      : `${apiV1}${path.startsWith("/") ? path : `/${path}`}`

  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${apiKey}`)
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !init.skipJsonContentType
  ) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  }

  return fetch(url, { ...init, headers })
}

export async function hermesHealth(): Promise<unknown> {
  const { origin, apiV1 } = getHermesServerConfig()
  let res = await hermesAuthFetch(`${origin}/health`, {
    method: "GET",
    skipJsonContentType: true,
  })
  if (!res.ok) {
    res = await hermesAuthFetch(`${apiV1}/health`, {
      method: "GET",
      skipJsonContentType: true,
    })
  }
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
export async function hermesChatCompletion(body: Record<string, unknown>): Promise<unknown> {
  const res = await hermesAuthFetch("/chat/completions", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
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
