/**
 * Hermes Agent OpenAI-compatible API — server-side only.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */

import path from "node:path"

/**
 * JSON `model` on `POST /v1/chat/completions` when env vars are unset.
 * Per Hermes API docs, this field is cosmetic — the real LLM is set in Hermes server config.
 * `hermes-agent` matches the default profile / official examples.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server (Limitations)
 */
export const DEFAULT_HERMES_CHAT_MODEL = "hermes-agent"

function optionalMaxTokens(raw: string | undefined): number | undefined {
  if (raw == null || !String(raw).trim()) return undefined
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 1 || n > 1_000_000) return undefined
  return n
}

/**
 * Root directory for per-run extraction files: `{base}/{promptSlug}/{runId}/…`
 * Set `EXTRACTION_OUTPUT_DIR`, or derive from dirname of `EXTRACTION_OUTPUT_JSON_FILE`.
 */
export function getExtractionOutputBaseDir(): string | null {
  const dir = process.env.EXTRACTION_OUTPUT_DIR?.trim()
  if (dir) return path.resolve(dir)

  const json = process.env.EXTRACTION_OUTPUT_JSON_FILE?.trim()
  const csv = process.env.EXTRACTION_OUTPUT_CSV_FILE?.trim()
  if (!json || !csv) return null
  return path.resolve(path.dirname(json))
}

export function isExtractionOutputConfigured(): boolean {
  if (process.env.EXTRACTION_OUTPUT_DIR?.trim()) return true
  const json = process.env.EXTRACTION_OUTPUT_JSON_FILE?.trim()
  const csv = process.env.EXTRACTION_OUTPUT_CSV_FILE?.trim()
  return Boolean(json && csv)
}

/** Basenames used inside each `{promptSlug}/{runId}/` folder. */
export function getExtractionOutputFilenameTemplate(): {
  json: string
  csv: string
} | null {
  if (!isExtractionOutputConfigured()) return null

  const json = process.env.EXTRACTION_OUTPUT_JSON_FILE?.trim()
  const csv = process.env.EXTRACTION_OUTPUT_CSV_FILE?.trim()
  return {
    json: json ? path.basename(json) : "output.json",
    csv: csv ? path.basename(csv) : "output.csv",
  }
}

/**
 * @deprecated Use per-run paths from {@link buildExtractionRunOutputPaths}. Kept for callers that need a quick configured check.
 */
export function getExtractionOutputManifestPaths(): {
  json: string
  csv: string
} | null {
  const base = getExtractionOutputBaseDir()
  const names = getExtractionOutputFilenameTemplate()
  if (!base || !names) return null
  return {
    json: path.join(base, names.json),
    csv: path.join(base, names.csv),
  }
}

export function getHermesServerConfig() {
  const origin = (
    process.env.HERMES_BASE_URL ?? "http://127.0.0.1:8642"
  ).replace(/\/$/, "")
  /** Optional. Omitted from Hermes requests when unset (typical local gateway without API_SERVER_KEY). */
  const apiKey = process.env.HERMES_API_KEY?.trim() ?? ""
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
