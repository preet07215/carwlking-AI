import { NextResponse } from "next/server"

import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 })
  }
  const { id } = await ctx.params
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 })
  }
  try {
    const supabase = createSupabaseAdmin()
    const { error } = await supabase.from("extraction_history").delete().eq("id", id.trim())
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
