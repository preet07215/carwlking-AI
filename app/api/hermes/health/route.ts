import { NextResponse } from "next/server"

import { getHermesServerConfig } from "@/lib/hermes/config"
import { formatGenericHermesFailure } from "@/lib/hermes/errors"
import { HermesUpstreamError, hermesHealth } from "@/lib/hermes/client"

export const dynamic = "force-dynamic"

export async function GET() {
  const { origin } = getHermesServerConfig()
  try {
    const data = await hermesHealth()
    return NextResponse.json({ ok: true, data, origin })
  } catch (err) {
    if (err instanceof HermesUpstreamError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          detail: err.body.slice(0, 2000),
          hint: `Hermes reported HTTP ${err.status}. Check logs from hermes gateway. Base URL: ${origin}`,
          origin,
        },
        { status: 503 }
      )
    }
    const { message, hint } = formatGenericHermesFailure(err)
    const extra =
      err instanceof Error
        ? (err as Error & { hint?: string }).hint
        : undefined
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: extra ?? hint ?? `Expected Hermes at ${origin}`,
        origin,
      },
      { status: 503 }
    )
  }
}
