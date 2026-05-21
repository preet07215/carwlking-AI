import fs from "node:fs/promises"
import path from "node:path"

import { isExtractionOutputConfigured } from "@/lib/hermes/config"
import { isExtractionOutputPathAllowed } from "@/lib/extract/output-paths"

export type ExtractionOutputKind = "json" | "csv"

const MIME: Record<ExtractionOutputKind, string> = {
  json: "application/json;charset=utf-8",
  csv: "text/csv;charset=utf-8",
}

function kindFromPath(filePath: string): ExtractionOutputKind | null {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === ".json") return "json"
  if (ext === ".csv") return "csv"
  return null
}

export async function readExtractionOutputAtPath(
  filePath: string
): Promise<
  | { ok: true; body: Buffer; filename: string; contentType: string }
  | { ok: false; error: string; status: number }
> {
  if (!isExtractionOutputConfigured()) {
    return {
      ok: false,
      error:
        "Output paths not configured. Set EXTRACTION_OUTPUT_DIR or EXTRACTION_OUTPUT_JSON_FILE + EXTRACTION_OUTPUT_CSV_FILE.",
      status: 503,
    }
  }

  const trimmed = filePath.trim()
  if (!trimmed) {
    return { ok: false, error: "path is required", status: 400 }
  }

  if (!isExtractionOutputPathAllowed(trimmed)) {
    return { ok: false, error: "Path not allowed", status: 403 }
  }

  const resolved = path.resolve(trimmed)
  const kind = kindFromPath(resolved)
  const contentType =
    kind != null ? MIME[kind] : "application/octet-stream"

  try {
    const body = await fs.readFile(resolved)
    return {
      ok: true,
      body,
      filename: path.basename(resolved) || "download",
      contentType,
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code
    if (code === "ENOENT") {
      return {
        ok: false,
        error: `File not found at ${resolved}.`,
        status: 404,
      }
    }
    const msg = e instanceof Error ? e.message : "Read failed"
    return { ok: false, error: msg, status: 500 }
  }
}
