/**
 * Hermes Agent OpenAI-compatible API — server-side only.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */

/**
 * Last-resort chat `model` when `HERMES_MODEL` and `OPENROUTER_DEFAULT_MODEL` are unset.
 * Use a real provider id (e.g. OpenRouter); `"hermes-agent"` is not a chat completions model name.
 */
export const DEFAULT_HERMES_CHAT_MODEL =
  "qwen/qwen3-next-80b-a3b-instruct:free"

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
  const model =
    process.env.HERMES_MODEL?.trim() ||
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ||
    DEFAULT_HERMES_CHAT_MODEL
  const maxTokens = optionalMaxTokens(process.env.HERMES_MAX_TOKENS)

  return {
    origin,
    /** OpenAI-style API root, e.g. http://127.0.0.1:8642/v1 */
    apiV1: `${origin}/v1`,
    apiKey,
    model,
    /** Optional `max_tokens` for chat/completions when `HERMES_MAX_TOKENS` is set. */
    maxTokens,
  }
}
