const MAX_MODEL_ID_LEN = 256

export type ExtractPayload = {
  targetUrl: string
  prompt: string
  headersSample?: string
  /** Client run id — used for per-prompt output directory `{base}/{promptSlug}/{runId}/`. */
  runId?: string
  /** Sent as JSON `model` on Hermes chat/completions. Hermes treats this as cosmetic; real LLM is server-side. */
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

  let runId: string | undefined
  if (typeof b.runId === "string") {
    const t = b.runId.trim()
    if (t.length > 128) throw new Error("runId must be at most 128 characters")
    if (t) runId = t
  }

  return { targetUrl, prompt, headersSample, runId, model, useProxy }
}
