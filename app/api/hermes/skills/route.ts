import { NextResponse } from "next/server"

import { createSkill, listSkills } from "@/lib/hermes/skills-store"
import type { HermesSkillCreateInput } from "@/lib/hermes/skills-types"

export const runtime = "nodejs"

function parseCreateBody(body: unknown): HermesSkillCreateInput | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const name = typeof o.name === "string" ? o.name : ""
  const description =
    typeof o.description === "string" ? o.description : ""
  const md = typeof o.body === "string" ? o.body : ""
  if (!name.trim()) return null
  return { name, description, body: md }
}

export async function GET() {
  const skills = await listSkills()
  return NextResponse.json({ skills })
}

export async function POST(req: Request) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const input = parseCreateBody(json)
  if (!input) {
    return NextResponse.json(
      { error: "Missing or invalid fields: name (required), description, body" },
      { status: 400 }
    )
  }

  const skill = await createSkill(input)
  return NextResponse.json({ skill }, { status: 201 })
}
