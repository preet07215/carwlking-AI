import {
  getExtractionOutputManifestPaths,
  getHermesServerConfig,
} from "@/lib/hermes/config"

function fileManifestInstructions(
  paths: { json: string; csv: string } | null
): string {
  if (!paths) return ""

  const { json, csv } = paths
  return `

## Output delivery (mandatory for this run)
- Do NOT print large datasets or full JSON inline in the chat.
- Save the full structured output directly to files on the agent host using your file tools:
  - JSON: ${json}
  - CSV: ${csv}
- After both files are saved, your FINAL assistant message MUST be exactly one JSON object and nothing else (no markdown fences, no commentary). Shape:
  {"status":"completed","json_file":"${json}","csv_file":"${csv}","total_categories":<integer>}
- Set total_categories to the correct count (e.g. number of categories or rows, per the extraction task). Never echo the full dataset in chat — only this small JSON object.`
}

export function buildExtractionMessages(payload: {
  targetUrl: string
  prompt: string
  headersSample?: string
}) {
  const { targetUrl, prompt, headersSample } = payload

  const headersBlock =
    headersSample?.trim() ??
    "(No headers / sample file provided — use default public fetch behavior.)"

  const manifestPaths = getExtractionOutputManifestPaths()

  const system = `You are an expert web data extraction assistant running in Hermes Agent.
Rules:
- Use your tools when needed to fetch and analyze the page at the given Target URL.
- If you cannot access the URL, say so in JSON — use a single JSON object with keys like "error" and "detail" (no markdown, no prose outside JSON).
- Your FINAL reply MUST be exactly one JSON value (usually an object) — valid JSON only: no markdown fences, no code blocks, no commentary before or after.
- Choose property names and nesting so the result cleanly represents what the user asked to extract.
- Treat optional headers/sample/HAR text as request context (cookies, auth, API shapes), not as the page URL.${fileManifestInstructions(manifestPaths)}`

  const outputClosing = manifestPaths
    ? `Follow the system prompt “Output delivery” section: save the full dataset to the configured JSON and CSV paths on the agent host, then return ONLY the small completion JSON object (status / json_file / csv_file / total_categories) — not the full extracted data inline.`
    : `Return only JSON matching the extraction instructions above.`

  const user = `## Target URL
${targetUrl.trim()}

## Extraction instructions
${prompt.trim()}

## Headers / sample / HAR context (optional)
${headersBlock}

## Output
${outputClosing}`

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
  },
  opts?: { stream?: boolean; model?: string }
) {
  const { model: envModel, maxTokens } = getHermesServerConfig()
  // Per-request model when provided; else HERMES_MODEL / OPENROUTER_DEFAULT_MODEL / default.
  // Hermes may still use a server-configured LLM regardless of this field (see API docs).
  const model = opts?.model?.trim() || envModel
  const body: Record<string, unknown> = {
    model,
    messages: buildExtractionMessages(payload),
    stream: opts?.stream ?? false,
  }
  if (maxTokens != null) {
    body.max_tokens = maxTokens
  }
  return body
}
