export type ExtractionCompletionManifest = {
  status: string
  json_file: string
  csv_file: string
  total_categories?: number
}

/** Small completion object when Hermes writes full data to configured file paths. */
export function parseExtractionCompletionManifest(
  parsed: unknown
): ExtractionCompletionManifest | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
  const o = parsed as Record<string, unknown>
  if (o.status !== "completed") return null
  if (typeof o.json_file !== "string" || !o.json_file.trim()) return null
  if (typeof o.csv_file !== "string" || !o.csv_file.trim()) return null
  const total =
    typeof o.total_categories === "number" && Number.isFinite(o.total_categories)
      ? o.total_categories
      : undefined
  return {
    status: "completed",
    json_file: o.json_file.trim(),
    csv_file: o.csv_file.trim(),
    ...(total != null ? { total_categories: total } : {}),
  }
}

export function extractionCompletionFromText(
  raw: string
): ExtractionCompletionManifest | null {
  try {
    const parsed = JSON.parse(raw.trim()) as unknown
    return parseExtractionCompletionManifest(parsed)
  } catch {
    return null
  }
}
