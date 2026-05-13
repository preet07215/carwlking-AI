import { NextResponse } from "next/server"

import { HermesUpstreamError, hermesPostJson } from "@/lib/hermes/client"

/**
 * Proxy POST /v1/runs — Hermes runs API (see Hermes docs).
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Expected object" }, { status: 400 })
  }

  try {
    const data = await hermesPostJson("/runs", body as Record<string, unknown>)
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    if (err instanceof HermesUpstreamError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          detail: err.body.slice(0, 8000),
        },
        { status: 502 }
      )
    }
    const message = err instanceof Error ? err.message : "Run create failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
