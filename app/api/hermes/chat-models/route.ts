import { NextResponse } from "next/server"

import { HermesUpstreamError, hermesModels } from "@/lib/hermes/client"
import { getHermesServerConfig } from "@/lib/hermes/config"
import { parseHermesModelsList } from "@/lib/hermes/parse-models-list"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Models advertised by Hermes GET /v1/models for the Extract UI chat `model` field.
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */
export async function GET() {
  const { model: envFallback } = getHermesServerConfig()

  try {
    const data = await hermesModels()
    let models = parseHermesModelsList(data)

    if (models.length === 0) {
      models = [{ id: envFallback, name: envFallback }]
    }

    const defaultModel =
      models.find((m) => m.id === envFallback)?.id ??
      models[0]!.id

    return NextResponse.json({
      ok: true,
      models,
      defaultModel,
    })
  } catch (err) {
    if (err instanceof HermesUpstreamError) {
      return NextResponse.json(
        {
          ok: false,
          models: [{ id: envFallback, name: envFallback }],
          defaultModel: envFallback,
          error: err.message,
          detail: err.body.slice(0, 800),
        },
        { status: 502 }
      )
    }
    const message =
      err instanceof Error ? err.message : "Hermes models request failed"
    return NextResponse.json(
      {
        ok: false,
        models: [{ id: envFallback, name: envFallback }],
        defaultModel: envFallback,
        error: message,
      },
      { status: 500 }
    )
  }
}
