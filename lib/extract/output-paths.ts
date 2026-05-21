import fs from "node:fs/promises"
import path from "node:path"

import {
  getExtractionOutputBaseDir,
  getExtractionOutputFilenameTemplate,
  isExtractionOutputConfigured,
} from "@/lib/hermes/config"

export type ExtractionRunOutputPaths = {
  json: string
  csv: string
  dir: string
  promptSlug: string
  runId: string
}

/** Safe folder name from extraction prompt text. */
export function slugifyPrompt(prompt: string): string {
  const s = prompt
    .trim()
    .slice(0, 96)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s.slice(0, 48) || "prompt"
}

export function buildExtractionRunOutputPaths(opts: {
  prompt: string
  runId: string
}): ExtractionRunOutputPaths | null {
  if (!isExtractionOutputConfigured()) return null

  const base = getExtractionOutputBaseDir()
  const names = getExtractionOutputFilenameTemplate()
  if (!base || !names) return null

  const runId = opts.runId.trim()
  if (!runId) return null

  const promptSlug = slugifyPrompt(opts.prompt)
  const dir = path.join(base, promptSlug, runId)
  return {
    json: path.join(dir, names.json),
    csv: path.join(dir, names.csv),
    dir,
    promptSlug,
    runId,
  }
}

export async function ensureExtractionRunOutputDir(
  paths: ExtractionRunOutputPaths
): Promise<void> {
  await fs.mkdir(paths.dir, { recursive: true })
}

/** Resolved path must stay under the configured output base directory. */
export function isExtractionOutputPathAllowed(filePath: string): boolean {
  const base = getExtractionOutputBaseDir()
  if (!base) return false
  const resolved = path.resolve(filePath)
  const baseResolved = path.resolve(base)
  if (resolved === baseResolved) return false
  const rel = path.relative(baseResolved, resolved)
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel)
}
