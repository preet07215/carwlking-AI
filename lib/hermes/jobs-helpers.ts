/** Helpers for Hermes GET /api/jobs list shape variance. */

export function normalizeHermesJobsList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.jobs)) return o.jobs
    if (Array.isArray(o.data)) return o.data
    if (Array.isArray(o.items)) return o.items
  }
  return []
}

export function extractHermesJobId(job: unknown): string | null {
  if (!job || typeof job !== "object") return null
  const o = job as Record<string, unknown>
  for (const k of ["job_id", "id", "jobId"]) {
    const v = o[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}
