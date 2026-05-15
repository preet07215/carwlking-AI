/**
 * Hermes Agent OpenAI-compatible API — server-side only.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */

function optionalMaxTokens(raw: string | undefined): number | undefined {
  if (raw == null || !String(raw).trim()) return undefined
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 1 || n > 1_000_000) return undefined
  return n
}

export function getHermesServerConfig() {
  const origin = (
    process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642"
  ).replace(/\/$/, "")
  const apiKey = process.env.HERMES_API_KEY ?? "change-me-local-dev"
  const model = process.env.HERMES_MODEL ?? "hermes-agent"
  const maxTokens = optionalMaxTokens(process.env.HERMES_MAX_TOKENS)

  return {
    origin,
    /** OpenAI-style API root, e.g. http://127.0.0.1:8642/v1 */
    apiV1: `${origin}/v1`,
    apiKey,
    model,
    /**
     * Passed through on chat/completions when set. Helps some OpenRouter-backed
     * setups; does not fix provider idle timeouts during long tool silence.
     */
    maxTokens,
  }
}
