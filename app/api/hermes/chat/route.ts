import { NextResponse } from "next/server"

import {
  HermesUpstreamError,
  hermesChatCompletion,
} from "@/lib/hermes/client"

/**
 * Passthrough to Hermes POST /v1/chat/completions (non-streaming).
 * Body must match OpenAI chat completions shape (model, messages, stream?: false).
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

  const b = body as Record<string, unknown>
  if (!Array.isArray(b.messages)) {
    return NextResponse.json(
      { ok: false, error: "messages array required" },
      { status: 400 }
    )
  }

  const payload = {
    ...b,
    stream: false,
  }

  try {
    const data = await hermesChatCompletion(payload)
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
    const message = err instanceof Error ? err.message : "Chat failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
