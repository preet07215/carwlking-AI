/**
 * OpenRouter GET https://openrouter.ai/api/v1/models — pricing strings are USD per token.
 * Display uses per-million-token figures for readability.
 */

export type OpenRouterModelPricing = {
  prompt?: string
  completion?: string
  web_search?: string
  input_cache_read?: string
  input_cache_write?: string
}

export type NormalizedOpenRouterModel = {
  id: string
  name: string
  created: number
  pricing: OpenRouterModelPricing | null
  /** Short label for UI, e.g. "In $30.00/M tok · Out $150.00/M tok" */
  pricingSummary: string | null
}

function pickPricing(raw: unknown): OpenRouterModelPricing | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  const out: OpenRouterModelPricing = {}
  const keys = [
    "prompt",
    "completion",
    "web_search",
    "input_cache_read",
    "input_cache_write",
  ] as const
  for (const k of keys) {
    const v = p[k]
    if (typeof v === "string" && v.trim()) out[k] = v.trim()
  }
  return Object.keys(out).length > 0 ? out : null
}

export function openRouterPricingSummary(
  pricing: OpenRouterModelPricing | null
): string | null {
  if (!pricing?.prompt || !pricing?.completion) return null
  const p = Number.parseFloat(pricing.prompt)
  const c = Number.parseFloat(pricing.completion)
  if (!Number.isFinite(p) || !Number.isFinite(c)) return null
  const inM = p * 1_000_000
  const outM = c * 1_000_000
  const fmt = (n: number) =>
    n >= 1 ? n.toFixed(2) : n >= 0.01 ? n.toFixed(4) : n.toExponential(2)
  return `In $${fmt(inM)}/M tok · Out $${fmt(outM)}/M tok`
}

export function normalizeOpenRouterModels(
  raw: unknown
): NormalizedOpenRouterModel[] {
  if (!raw || typeof raw !== "object") return []
  const o = raw as { data?: unknown }
  if (!Array.isArray(o.data)) return []

  const list: NormalizedOpenRouterModel[] = []
  for (const item of o.data) {
    if (!item || typeof item !== "object") continue
    const m = item as Record<string, unknown>
    const id = typeof m.id === "string" ? m.id.trim() : ""
    if (!id) continue
    const name =
      typeof m.name === "string" && m.name.trim() ? m.name.trim() : id
    const created =
      typeof m.created === "number" && Number.isFinite(m.created) ? m.created : 0
    const pricing = pickPricing(m.pricing)
    list.push({
      id,
      name,
      created,
      pricing,
      pricingSummary: openRouterPricingSummary(pricing),
    })
  }

  return list.sort((a, b) =>
    b.created !== a.created ? b.created - a.created : a.id.localeCompare(b.id)
  )
}
