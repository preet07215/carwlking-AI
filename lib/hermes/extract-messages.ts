import { getHermesServerConfig } from "@/lib/hermes/config"

export function buildExtractionMessages(payload: {
  targetUrl: string
  prompt: string
  headersSample?: string
  jsonSchema?: string
}) {
  const { jsonSchema, targetUrl, prompt, headersSample } = payload

  const schemaBlock =
    jsonSchema?.trim() ??
    "(No JSON Schema provided — respond with clearly structured Markdown or JSON.)"

  const headersBlock =
    headersSample?.trim() ??
    "(No headers / sample file provided — use default public fetch behavior.)"

  const system = `You are an expert web data extraction assistant running in Hermes Agent.
Rules:
- Use your tools when needed to fetch and analyze the page at the given Target URL.
- If you cannot access the URL, say so and summarize what would be needed (e.g. auth).
- If a JSON Schema is provided, your FINAL reply MUST be a single valid JSON object matching that schema only — no markdown fences, no commentary before or after.
- If no schema is provided, reply with well-structured Markdown or JSON as appropriate.
- Treat optional headers/sample/HAR text as request context (cookies, auth, API shapes), not as the page URL.`

  const user = `## Target URL
${targetUrl.trim()}

## Extraction instructions
${prompt.trim()}

## Headers / sample / HAR context (optional)
${headersBlock}

## Desired output shape (JSON Schema, optional)
${schemaBlock}`

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ]
}

export function chatBodyForExtract(
  payload: {
    targetUrl: string
    prompt: string
    headersSample?: string
    jsonSchema?: string
  },
  options?: { stream?: boolean }
) {
  const { model } = getHermesServerConfig()
  return {
    model,
    messages: buildExtractionMessages(payload),
    stream: options?.stream ?? false,
  }
}
