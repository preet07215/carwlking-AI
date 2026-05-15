import { NextResponse } from "next/server"

import { HermesUpstreamError, hermesModels } from "@/lib/hermes/client"
import { getHermesServerConfig } from "@/lib/hermes/config"
import { parseHermesModelsList } from "@/lib/hermes/parse-models-list"
import { normalizeOpenRouterModels } from "@/lib/openrouter/model-catalog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const OPENROUTER_MODELS = "https://openrouter.ai/api/v1/models"

export type UnifiedCatalogModel = {
  id: string
  name: string
  source: "hermes" | "openrouter"
  pricingSummary?: string | null
}

/**
 * Single catalog for Extract: Hermes GET /v1/models first, then OpenRouter models
 * (deduped by id). Default prefers HERMES_MODEL, then OPENROUTER_DEFAULT_MODEL.
 */
export async function GET() {
  const { model: hermesEnvDefault } = getHermesServerConfig()
  const openrouterPreferred =
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ||
    "anthropic/claude-opus-4.7-fast"

  const hermesList: UnifiedCatalogModel[] = []
  let hermesError: string | null = null

  try {
    const raw = await hermesModels()
    for (const m of parseHermesModelsList(raw)) {
      hermesList.push({
        id: m.id,
        name: m.name,
        source: "hermes",
        pricingSummary: null,
      })
    }
  } catch (e) {
    hermesError =
      e instanceof HermesUpstreamError
        ? e.message
        : e instanceof Error
          ? e.message
          : "Hermes /v1/models unreachable"
  }

  if (hermesList.length === 0) {
    hermesList.push({
      id: hermesEnvDefault,
      name: `${hermesEnvDefault} (fallback — check gateway / API_SERVER_ENABLED)`,
      source: "hermes",
    })
  }

  const seen = new Set(hermesList.map((m) => m.id))
  const openrouterList: UnifiedCatalogModel[] = []
  let openrouterError: string | null = null

  try {
    const key = process.env.OPENROUTER_API_KEY?.trim()
    const headers: Record<string, string> = { Accept: "application/json" }
    if (key) headers.Authorization = `Bearer ${key}`
    const res = await fetch(OPENROUTER_MODELS, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      openrouterError = `OpenRouter list HTTP ${res.status}`
    } else {
      const json = (await res.json()) as unknown
      for (const m of normalizeOpenRouterModels(json)) {
        if (seen.has(m.id)) continue
        seen.add(m.id)
        openrouterList.push({
          id: m.id,
          name: m.name,
          source: "openrouter",
          pricingSummary: m.pricingSummary,
        })
      }
    }
  } catch (e) {
    openrouterError =
      e instanceof Error ? e.message : "OpenRouter models fetch failed"
  }

  const models = [...hermesList, ...openrouterList]

  const defaultModel =
    models.find((m) => m.id === hermesEnvDefault)?.id ??
    models.find((m) => m.id === openrouterPreferred)?.id ??
    models[0]!.id

  return NextResponse.json({
    ok: true,
    models,
    defaultModel,
    hints: {
      hermesError,
      openrouterError,
    },
  })
}
