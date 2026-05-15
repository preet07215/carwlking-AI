import { NextResponse } from "next/server"

import {
  HermesUpstreamError,
  hermesDelete,
  hermesGetJson,
  hermesPatchJson,
} from "@/lib/hermes/client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function jobPath(id: string): string {
  return `/api/jobs/${encodeURIComponent(id.trim())}`
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing job id" }, { status: 400 })
  }
  try {
    const data = await hermesGetJson(jobPath(id))
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
      { ok: false, error: err instanceof Error ? err.message : "GET job failed" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing job id" }, { status: 400 })
  }
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
    const data = await hermesPatchJson(
      jobPath(id),
      body as Record<string, unknown>
    )
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
      { ok: false, error: err instanceof Error ? err.message : "PATCH failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "Missing job id" }, { status: 400 })
  }
  try {
    const data = await hermesDelete(jobPath(id))
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
      { ok: false, error: err instanceof Error ? err.message : "DELETE failed" },
      { status: 500 }
    )
  }
}
