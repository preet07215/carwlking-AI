import { NextResponse } from "next/server"

import {
  deleteSkill,
  getSkillById,
  updateSkill,
} from "@/lib/hermes/skills-store"
import type { HermesSkillUpdateInput } from "@/lib/hermes/skills-types"

export const runtime = "nodejs"

function parsePatchBody(body: unknown): HermesSkillUpdateInput | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const patch: HermesSkillUpdateInput = {}
  if ("name" in o) {
    if (typeof o.name !== "string") return null
    patch.name = o.name
  }
  if ("description" in o) {
    if (typeof o.description !== "string") return null
    patch.description = o.description
  }
  if ("body" in o) {
    if (typeof o.body !== "string") return null
    patch.body = o.body
  }
  if (
    patch.name === undefined &&
    patch.description === undefined &&
    patch.body === undefined
  ) {
    return null
  }
  if (patch.name !== undefined && !patch.name.trim()) return null
  return patch
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const skill = await getSkillById(id)
  if (!skill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ skill })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const patch = parsePatchBody(json)
  if (!patch) {
    return NextResponse.json(
      { error: "Provide at least one of: name, description, body" },
      { status: 400 }
    )
  }

  const skill = await updateSkill(id, patch)
  if (!skill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ skill })
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const ok = await deleteSkill(id)
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
