/**
 * Parse OpenAI-style GET /v1/models JSON from Hermes.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */
export function parseHermesModelsList(raw: unknown): { id: string; name: string }[] {
  if (!raw || typeof raw !== "object") return []
  const o = raw as Record<string, unknown>
  const data = o.data
  if (!Array.isArray(data)) return []

  const out: { id: string; name: string }[] = []
  for (const item of data) {
    if (!item || typeof item !== "object") continue
    const m = item as Record<string, unknown>
    const id = typeof m.id === "string" ? m.id.trim() : ""
    if (!id) continue
    const name =
      typeof m.name === "string" && m.name.trim() ? m.name.trim() : id
    out.push({ id, name })
  }

  return out.sort((a, b) => a.id.localeCompare(b.id))
}
