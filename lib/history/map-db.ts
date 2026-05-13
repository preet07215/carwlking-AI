import type { ExtractionRecord, ExtractionStatus } from "@/lib/mock-extractions"

export type ExtractionHistoryRow = {
  id: string
  url: string
  status: string
  duration_ms: number
  created_at: string
  result_text: string | null
}

const STATUSES: ExtractionStatus[] = ["completed", "running", "failed"]

function asStatus(s: string): ExtractionStatus {
  return STATUSES.includes(s as ExtractionStatus)
    ? (s as ExtractionStatus)
    : "completed"
}

export function dbRowToRecord(row: ExtractionHistoryRow): ExtractionRecord {
  return {
    id: row.id,
    url: row.url,
    status: asStatus(row.status),
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    resultText: row.result_text ?? undefined,
  }
}

export function recordToDbRow(r: ExtractionRecord): ExtractionHistoryRow {
  return {
    id: r.id,
    url: r.url,
    status: r.status,
    duration_ms: r.durationMs,
    created_at: r.createdAt,
    result_text: r.resultText ?? null,
  }
}
