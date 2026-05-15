import { NextResponse } from "next/server"

import { HermesUpstreamError, hermesPostEmpty } from "@/lib/hermes/client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing job id" }, { status: 400 })
  }
  try {
    const path = `/api/jobs/${encodeURIComponent(id.trim())}/resume`
    const data = await hermesPostEmpty(path)
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
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Resume failed" },
      { status: 500 }
    )
  }
}
