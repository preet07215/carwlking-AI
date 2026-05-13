import { getHermesServerConfig } from "@/lib/hermes/config"

/** Node/undici: failed TCP often surfaces as TypeError "fetch failed" + err.cause.code */
export function errnoFromFetchError(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined
  const c = (err as Error & { cause?: unknown }).cause
  if (c && typeof c === "object" && "code" in c) {
    return String((c as { code?: string }).code)
  }
  return undefined
}

export function isLikelyConnectionFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (err.message === "fetch failed") return true
  const code = errnoFromFetchError(err)
  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT"
  ) {
    return true
  }
  return false
}

export function formatHermesConnectionHelp(
  err: unknown,
  urlAttempted: string
): { error: string; hint: string; code?: string } {
  const { origin } = getHermesServerConfig()
  const code = errnoFromFetchError(err)
  const error =
    "Cannot reach Hermes API. The Next.js server could not open a TCP connection."

  const hint = [
    `Trying: ${urlAttempted} — HERMES_BASE_URL is ${origin}`,
    code ? `OS error code: ${code}` : null,
    "1) In Hermes ~/.hermes/.env: API_SERVER_ENABLED=true and API_SERVER_KEY=… (match HERMES_API_KEY in .env.local)",
    "2) Run: hermes gateway — expect [API Server] listening on http://127.0.0.1:8642",
    "3) Restart Next.js (npm run dev) after editing .env.local",
  ]
    .filter(Boolean)
    .join("\n")

  return code ? { error, hint, code } : { error, hint }
}

export function formatGenericHermesFailure(err: unknown): { message: string; hint?: string } {
  if (err instanceof Error) {
    const hint = (err as Error & { hint?: string }).hint
    if (err.message === "fetch failed" || isLikelyConnectionFailure(err)) {
      const code = errnoFromFetchError(err)
      return {
        message: code
          ? `Cannot connect to Hermes (fetch failed / ${code})`
          : "Cannot connect to Hermes (fetch failed)",
        hint,
      }
    }
    if (hint) return { message: err.message, hint }
    return { message: err.message }
  }
  return { message: "Unexpected error talking to Hermes" }
}
