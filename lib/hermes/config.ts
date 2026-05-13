/**
 * Hermes Agent OpenAI-compatible API — server-side only.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */
export function getHermesServerConfig() {
  const origin = (
    process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642"
  ).replace(/\/$/, "")
  const apiKey = process.env.HERMES_API_KEY ?? "change-me-local-dev"
  const model = process.env.HERMES_MODEL ?? "hermes-agent"

  return {
    origin,
    /** OpenAI-style API root, e.g. http://127.0.0.1:8642/v1 */
    apiV1: `${origin}/v1`,
    apiKey,
    model,
  }
}
