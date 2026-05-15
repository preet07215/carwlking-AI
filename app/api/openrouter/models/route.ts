import { NextResponse } from "next/server"

import { getHermesServerConfig } from "@/lib/hermes/config"
import { normalizeOpenRouterModels } from "@/lib/openrouter/model-catalog"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const OPENROUTER_MODELS = "https://openrouter.ai/api/v1/models"

/**
 * OpenRouter model catalog for Extract: `id` is sent as Hermes `POST /v1/chat/completions` `model`
 * when your gateway routes to OpenRouter (or accepts that id).
 * Optional OPENROUTER_API_KEY improves rate limits.
 */
export async function GET() {
  const { model: hermesFallback } = getHermesServerConfig()
  const preferredId =
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ||
    "anthropic/claude-opus-4.7-fast"

  const key = process.env.OPENROUTER_API_KEY?.trim()
  const headers: Record<string, string> = { Accept: "application/json" }
  if (key) headers.Authorization = `Bearer ${key}`

  try {
    const res = await fetch(OPENROUTER_MODELS, {
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      const t = await res.text()
      return NextResponse.json(
        {
          ok: false,
          error: `OpenRouter models request failed (${res.status})`,
          detail: t.slice(0, 800),
          defaultModel: hermesFallback,
          models: [],
        },
        { status: 502 }
      )
    }

    const json = (await res.json()) as unknown
    const models = normalizeOpenRouterModels(json)

    const defaultModel =
      models.some((m) => m.id === preferredId) ? preferredId
      : models.some((m) => m.id === hermesFallback) ? hermesFallback
      : (models[0]?.id ?? hermesFallback)

    return NextResponse.json({
      ok: true,
      models,
      defaultModel,
      source: "https://openrouter.ai/api/v1/models",
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { ok: false, error: msg, defaultModel: hermesFallback, models: [] },
      { status: 502 }
    )
  }
}
