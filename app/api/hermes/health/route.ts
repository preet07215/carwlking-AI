import { NextResponse } from "next/server"

import { HermesUpstreamError, hermesHealth } from "@/lib/hermes/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await hermesHealth()
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    if (err instanceof HermesUpstreamError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          detail: err.body.slice(0, 2000),
        },
        { status: 503 }
      )
    }
    const message = err instanceof Error ? err.message : "Health check failed"
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }
}
