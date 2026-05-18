import { NextResponse } from "next/server"

import { parseExtractJson } from "@/lib/extract/payload"
import {
  HermesUpstreamError,
  hermesChatCompletion,
} from "@/lib/hermes/client"
import { formatGenericHermesFailure } from "@/lib/hermes/errors"
import { logExtractModelDebug } from "@/lib/hermes/extract-model-debug"
import { chatBodyForExtract } from "@/lib/hermes/extract-messages"
import { getOxylabsWebUnblockerHeaderPairs } from "@/lib/proxy/oxylabs-hermes-headers"

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

  let payload: ReturnType<typeof parseExtractJson>
  try {
    payload = parseExtractJson(body)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid body"
    return NextResponse.json({ ok: false, error: msg }, { status: 400 })
  }

  const { targetUrl, prompt, headersSample, model: modelOverride, useProxy } =
    payload

  const proxyPairs = useProxy ? getOxylabsWebUnblockerHeaderPairs() : null
  if (useProxy && !proxyPairs) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Web unblocker proxy is enabled but OXYLABS_WEB_UNBLOCKER_USERNAME / OXYLABS_WEB_UNBLOCKER_PASSWORD are not set on the server.",
      },
      { status: 400 }
    )
  }

  const started = Date.now()

  try {
    const chatPayload = chatBodyForExtract(
      {
        targetUrl,
        prompt,
        headersSample,
      },
      { stream: false, model: modelOverride }
    )
    logExtractModelDebug({
      route: "POST /api/extract",
      requestModel: modelOverride,
      payloadModel: String(chatPayload.model ?? ""),
    })
    const raw = await hermesChatCompletion(chatPayload, {
      extraHeaders: proxyPairs ?? undefined,
    })
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
    const { message: friendly, hint } = formatGenericHermesFailure(err)
    const extraHint =
      err instanceof Error
        ? (err as Error & { hint?: string }).hint
        : undefined
    return NextResponse.json(
      {
        ok: false,
        error: friendly,
        hint: extraHint ?? hint,
        durationMs,
      },
      { status: 503 }
    )
  }
}
