export type ParsedAssistantResponse = {
  /** Parsed value when JSON was found */
  parsed: unknown | null
  /** Pretty-printed JSON-only text for display + download; null if no valid JSON */
  prettyJson: string | null
  /** Original slice that parsed (before pretty-print), when extracted from mixed text */
  jsonRawSlice: string | null
  extraBefore: string
  extraAfter: string
  raw: string
}

/** If the whole string is one ```json ... ``` block, return inner trim */
function stripOuterMarkdownFence(text: string): string {
  const t = text.trim()
  const m = /^```(?:json)?\s*([\s\S]*?)```\s*$/i.exec(t)
  if (m) return m[1].trim()
  return t
}

function tryParseFullJson(text: string): unknown | null {
  const t = text.trim()
  if (!t) return null
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

function findFirstJsonStart(s: string): number {
  const a = s.indexOf("{")
  const b = s.indexOf("[")
  if (a === -1 && b === -1) return -1
  if (a === -1) return b
  if (b === -1) return a
  return Math.min(a, b)
}

/**
 * First balanced JSON object/array substring starting at an opening brace/bracket.
 */
export function extractFirstBalancedJson(trimmed: string): {
  jsonText: string
  parsed: unknown
  start: number
} | null {
  const openIdx = findFirstJsonStart(trimmed)
  if (openIdx === -1) return null

  const first = trimmed[openIdx]
  if (first !== "{" && first !== "[") return null

  const stack: string[] = []
  if (first === "{") stack.push("}")
  else stack.push("]")

  let inString = false
  let escape = false

  for (let i = openIdx + 1; i < trimmed.length; i++) {
    const c = trimmed[i]
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (c === "\\") {
        escape = true
        continue
      }
      if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === "{") {
      stack.push("}")
      continue
    }
    if (c === "[") {
      stack.push("]")
      continue
    }
    if (c === "}" || c === "]") {
      const expected = stack.pop()
      if (expected !== c) return null
      if (stack.length === 0) {
        const jsonText = trimmed.slice(openIdx, i + 1)
        try {
          return {
            jsonText,
            parsed: JSON.parse(jsonText),
            start: openIdx,
          }
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/**
 * Splits model output into isolated JSON (if any) and surrounding prose.
 */
export function parseAssistantResponse(raw: string): ParsedAssistantResponse {
  const rawInput = raw
  const work = stripOuterMarkdownFence(rawInput)

  const full = tryParseFullJson(work)
  if (full !== null) {
    return {
      parsed: full,
      prettyJson: JSON.stringify(full, null, 2),
      jsonRawSlice: work.trim(),
      extraBefore: "",
      extraAfter: "",
      raw: rawInput,
    }
  }

  const extracted = extractFirstBalancedJson(work)
  if (extracted) {
    const before = work.slice(0, extracted.start).trim()
    const after = work.slice(extracted.start + extracted.jsonText.length).trim()
    return {
      parsed: extracted.parsed,
      prettyJson: JSON.stringify(extracted.parsed, null, 2),
      jsonRawSlice: extracted.jsonText,
      extraBefore: before,
      extraAfter: after,
      raw: rawInput,
    }
  }

  return {
    parsed: null,
    prettyJson: null,
    jsonRawSlice: null,
    extraBefore: "",
    extraAfter: work.trim(),
    raw: rawInput,
  }
}

/** File body: strict JSON text only, or null if none */
export function jsonTextForDownload(raw: string): string | null {
  const { prettyJson } = parseAssistantResponse(raw)
  return prettyJson
}
