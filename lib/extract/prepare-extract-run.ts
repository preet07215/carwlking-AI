import { randomUUID } from "node:crypto"

import {
  buildExtractionRunOutputPaths,
  ensureExtractionRunOutputDir,
  type ExtractionRunOutputPaths,
} from "@/lib/extract/output-paths"
import { isExtractionOutputConfigured } from "@/lib/hermes/config"

export type PreparedExtractRun = {
  runId: string
  outputPaths: ExtractionRunOutputPaths | null
}

export async function prepareExtractRun(opts: {
  prompt: string
  runId?: string
}): Promise<PreparedExtractRun> {
  const runId = opts.runId?.trim() || randomUUID()

  if (!isExtractionOutputConfigured()) {
    return { runId, outputPaths: null }
  }

  const outputPaths = buildExtractionRunOutputPaths({
    prompt: opts.prompt,
    runId,
  })
  if (outputPaths) {
    await ensureExtractionRunOutputDir(outputPaths)
  }

  return { runId, outputPaths }
}
