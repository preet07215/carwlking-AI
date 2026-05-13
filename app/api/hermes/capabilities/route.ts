import { NextResponse } from "next/server"

import { HermesUpstreamError, hermesCapabilities } from "@/lib/hermes/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const data = await hermesCapabilities()
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
        { status: 502 }
      )
    }
    const message =
      err instanceof Error ? err.message : "Capabilities request failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
