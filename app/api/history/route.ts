import { NextResponse } from "next/server"

import { dbRowToRecord, recordToDbRow, type ExtractionHistoryRow } from "@/lib/history/map-db"
import type { ExtractionRecord, ExtractionStatus } from "@/lib/mock-extractions"
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_RESULT_CHARS = 500_000

const STATUSES: ExtractionStatus[] = ["completed", "running", "failed"]

function parseRecord(body: unknown): ExtractionRecord | NextResponse {
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  const id = typeof b.id === "string" ? b.id.trim() : ""
  const url = typeof b.url === "string" ? b.url.trim() : ""
  const status = typeof b.status === "string" ? b.status.trim() : ""
  const durationMs = typeof b.durationMs === "number" && Number.isFinite(b.durationMs)
    ? Math.max(0, Math.round(b.durationMs))
    : 0
  const createdAt =
    typeof b.createdAt === "string" && b.createdAt.trim()
      ? b.createdAt.trim()
      : new Date().toISOString()
  let resultText: string | undefined
  if (typeof b.resultText === "string") {
    if (b.resultText.length > MAX_RESULT_CHARS) {
      return NextResponse.json(
        { ok: false, error: `resultText exceeds ${MAX_RESULT_CHARS} characters` },
        { status: 400 }
      )
    }
    resultText = b.resultText
  }

  if (!id || !url) {
    return NextResponse.json({ ok: false, error: "id and url required" }, { status: 400 })
  }
  if (!STATUSES.includes(status as ExtractionStatus)) {
    return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 })
  }

  return {
    id,
    url,
    status: status as ExtractionStatus,
    durationMs,
    createdAt,
    resultText,
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ configured: false, items: [] satisfies ExtractionRecord[] })
  }
  try {
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from("extraction_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json(
        { configured: true, items: [], error: error.message },
        { status: 500 }
      )
    }
    const items = (data ?? []).map((row) =>
      dbRowToRecord(row as ExtractionHistoryRow)
    )
    return NextResponse.json({ configured: true, items })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "History load failed"
    return NextResponse.json({ configured: true, items: [], error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = parseRecord(body)
  if (parsed instanceof NextResponse) return parsed

  try {
    const supabase = createSupabaseAdmin()
    const row = recordToDbRow(parsed)
    const { data, error } = await supabase
      .from("extraction_history")
      .upsert(row, { onConflict: "id" })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    const item = dbRowToRecord(data as ExtractionHistoryRow)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 })
  }
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase
      .from("extraction_history")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Clear failed"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
