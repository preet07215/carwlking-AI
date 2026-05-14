import { getHermesServerConfig } from "@/lib/hermes/config"
import { isWebUnblockerConfigured } from "@/lib/oxylabs/web-unblocker"

export function buildExtractionMessages(payload: {
  targetUrl: string
  prompt: string
  headersSample?: string
}) {
  const { targetUrl, prompt, headersSample } = payload

  const headersBlock =
    headersSample?.trim() ??
    "(No headers / sample file provided — use default public fetch behavior.)"

  const proxyNote = isWebUnblockerConfigured()
    ? `
- Anti-block: This app is configured for Oxylabs Web Unblocker. The Hermes gateway host must set HTTP_PROXY and HTTPS_PROXY in ~/.hermes/.env to the same unblocker URL (see project script npm run hermes:proxy-env). If loading the target URL fails with blocks, captchas, timeouts, or 403/429, retry after confirming those env vars are set and the gateway was restarted; prefer tool paths that honor standard proxy environment variables.
`
    : ""

  const system = `You are an expert web data extraction assistant running in Hermes Agent.
Rules:
- Use your tools when needed to fetch and analyze the page at the given Target URL.
- If you cannot access the URL, say so in JSON — use a single JSON object with keys like "error" and "detail" (no markdown, no prose outside JSON).
- Your FINAL reply MUST be exactly one JSON value (usually an object) — valid JSON only: no markdown fences, no code blocks, no commentary before or after.
- Choose property names and nesting so the result cleanly represents what the user asked to extract.
- Treat optional headers/sample/HAR text as request context (cookies, auth, API shapes), not as the page URL.${proxyNote}`

  const user = `## Target URL
${targetUrl.trim()}

## Extraction instructions
${prompt.trim()}

## Headers / sample / HAR context (optional)
${headersBlock}

## Output
Return only JSON matching the extraction instructions above.`

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
  options?: { stream?: boolean }
) {
  const { model } = getHermesServerConfig()
  return {
    model,
    messages: buildExtractionMessages(payload),
    stream: options?.stream ?? false,
  }
}
