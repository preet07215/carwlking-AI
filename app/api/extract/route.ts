import { NextResponse } from "next/server"

import {
  HermesUpstreamError,
  hermesChatCompletion,
} from "@/lib/hermes/client"
import { chatBodyForExtract } from "@/lib/hermes/extract-messages"

function assistantContent(data: unknown): string {
  if (!data || typeof data !== "object") return ""
  const o = data as Record<string, unknown>
  const choices = o.choices
  if (!Array.isArray(choices) || !choices[0]) return ""
  const first = choices[0] as Record<string, unknown>
  const message = first.message
  if (!message || typeof message !== "object") return ""
  const content = (message as Record<string, unknown>).content
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") return ""
        const p = part as Record<string, unknown>
        if (p.type === "text" && typeof p.text === "string") return p.text
        return ""
      })
      .join("")
  }
  return ""
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Expected JSON object" }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const targetUrl = typeof b.targetUrl === "string" ? b.targetUrl.trim() : ""
  const prompt = typeof b.prompt === "string" ? b.prompt.trim() : ""
  const headersSample =
    typeof b.headersSample === "string" ? b.headersSample : undefined
  const jsonSchema = typeof b.jsonSchema === "string" ? b.jsonSchema : undefined

  if (!targetUrl) {
    return NextResponse.json(
      { ok: false, error: "targetUrl is required" },
      { status: 400 }
    )
  }
  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "prompt is required" },
      { status: 400 }
    )
  }

  const started = Date.now()

  try {
    const chatPayload = chatBodyForExtract({
      targetUrl,
      prompt,
      headersSample,
      jsonSchema,
    })
    const raw = await hermesChatCompletion(chatPayload)
    const content = assistantContent(raw)
    const durationMs = Date.now() - started

    return NextResponse.json({
      ok: true,
      content,
      durationMs,
      /** Useful for debugging; omit in production if too large */
      usage: (raw as Record<string, unknown>)?.usage ?? null,
    })
  } catch (err) {
    const durationMs = Date.now() - started
    if (err instanceof HermesUpstreamError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          status: err.status,
          detail: err.body.slice(0, 8000),
          durationMs,
        },
        { status: 502 }
      )
    }
    const message = err instanceof Error ? err.message : "Extraction failed"
    return NextResponse.json(
      { ok: false, error: message, durationMs },
      { status: 500 }
    )
  }
}
