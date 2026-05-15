import { NextResponse } from "next/server"

import { getHermesServerConfig } from "@/lib/hermes/config"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const OPENROUTER_MODELS = "https://openrouter.ai/api/v1/models"

/**
 * Lists models from OpenRouter (optional; not used by the Extract flow — that uses Hermes /v1/models).
 * Optional OPENROUTER_API_KEY improves rate limits.
 */
export async function GET() {
  const { model: defaultModel } = getHermesServerConfig()
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
          defaultModel,
        },
        { status: 502 }
      )
    }

    const json = (await res.json()) as {
      data?: { id: string; name?: string; created?: number }[]
    }
    const raw = Array.isArray(json.data) ? json.data : []
    const models = raw
      .filter((m) => m && typeof m.id === "string" && m.id.length > 0)
      .map((m) => ({
        id: m.id,
        name:
          typeof m.name === "string" && m.name.trim()
            ? m.name.trim()
            : m.id,
        created:
          typeof m.created === "number" && Number.isFinite(m.created)
            ? m.created
            : 0,
      }))
      .sort((a, b) =>
        b.created !== a.created ? b.created - a.created : a.id.localeCompare(b.id)
      )

    return NextResponse.json({
      ok: true,
      models,
      defaultModel,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json(
      { ok: false, error: msg, defaultModel },
      { status: 502 }
    )
  }
}
