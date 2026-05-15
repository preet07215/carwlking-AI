import { NextResponse } from "next/server"

import {
  HermesUpstreamError,
  hermesGetJson,
  hermesPostJson,
} from "@/lib/hermes/client"
import { normalizeHermesJobsList } from "@/lib/hermes/jobs-helpers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Proxies Hermes Jobs API — GET /api/jobs, POST /api/jobs
 * @see https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server
 */
export async function GET() {
  try {
    const data = await hermesGetJson("/api/jobs")
    const jobs = normalizeHermesJobsList(data)
    return NextResponse.json({ ok: true, jobs, raw: data })
  } catch (err) {
    if (err instanceof HermesUpstreamError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          detail: err.body.slice(0, 8000),
          jobs: [],
        },
        { status: 502 }
      )
    }
    const message = err instanceof Error ? err.message : "Jobs list failed"
    return NextResponse.json(
      { ok: false, error: message, jobs: [] },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "Expected JSON object body" },
      { status: 400 }
    )
  }

  try {
    const data = await hermesPostJson("/api/jobs", body as Record<string, unknown>)
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
    const message = err instanceof Error ? err.message : "Job create failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
