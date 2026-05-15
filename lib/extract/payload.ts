const MAX_MODEL_ID_LEN = 256

export type ExtractPayload = {
  targetUrl: string
  prompt: string
  headersSample?: string
  /** OpenRouter-style model id (passed as chat `model` to Hermes). */
  model?: string
  /** When true, server adds Oxylabs Web Unblocker proxy URLs as headers to Hermes. */
  useProxy?: boolean
}

export function parseExtractJson(body: unknown): ExtractPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Expected JSON object")
  }
  const b = body as Record<string, unknown>
  const targetUrl = typeof b.targetUrl === "string" ? b.targetUrl.trim() : ""
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : ""
  const headersSample =
    typeof b.headersSample === "string" ? b.headersSample : undefined

  if (!targetUrl) throw new Error("targetUrl is required")
  if (!prompt) throw new Error("prompt is required")

  let model: string | undefined
  if (typeof b.model === "string") {
    const t = b.model.trim()
    if (t.length > MAX_MODEL_ID_LEN) {
      throw new Error(`model must be at most ${MAX_MODEL_ID_LEN} characters`)
    }
    if (t) model = t
  }

  const useProxy = b.useProxy === true

  return { targetUrl, prompt, headersSample, model, useProxy }
}
