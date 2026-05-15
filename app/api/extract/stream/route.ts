import { NextResponse } from "next/server"

import { parseExtractJson } from "@/lib/extract/payload"
import { getHermesServerConfig } from "@/lib/hermes/config"
import {
  formatGenericHermesFailure,
  isLikelyConnectionFailure,
} from "@/lib/hermes/errors"
import { chatBodyForExtract } from "@/lib/hermes/extract-messages"
import { getOxylabsWebUnblockerHeaderPairs } from "@/lib/proxy/oxylabs-hermes-headers"

/**
 * Forwards to Hermes chat.completions with stream: true (SSE).
 * Client uses fetch + ReadableStream (POST body required).
 * Note: Hermes may treat JSON `model` as cosmetic; LLM is server-configured.
 */
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Vercel: allow long SSE extractions (browser tools + streaming). @see https://vercel.com/docs/functions/configuring-functions/duration */
export const maxDuration = 3600

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
  const { apiV1, apiKey } = getHermesServerConfig()
  const chatPayload = chatBodyForExtract(
    { targetUrl, prompt, headersSample },
    { stream: true, model: modelOverride }
  )

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

  const forwardHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...(proxyPairs ?? {}),
  }

  let upstream: Response
  try {
    upstream = await fetch(`${apiV1}/chat/completions`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(chatPayload),
    })
  } catch (err) {
    if (isLikelyConnectionFailure(err)) {
      const extra =
        err instanceof Error
          ? (err as Error & { hint?: string }).hint
          : undefined
      const { message: friendly, hint } = formatGenericHermesFailure(err)
      return NextResponse.json(
        {
          ok: false,
          error: friendly,
          hint: extra ?? hint,
        },
        { status: 503 }
      )
    }
    throw err
  }

  if (!upstream.ok) {
    const text = await upstream.text()
    return NextResponse.json(
      {
        ok: false,
        error: "Hermes stream request failed",
        detail: text.slice(0, 8000),
        status: upstream.status,
      },
      { status: 502 }
    )
  }

  if (!upstream.body) {
    return NextResponse.json(
      { ok: false, error: "Empty stream from Hermes" },
      { status: 502 }
    )
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
