export type ExtractPayload = {
  targetUrl: string
  prompt: string
  headersSample?: string
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

  return { targetUrl, prompt, headersSample }
}
