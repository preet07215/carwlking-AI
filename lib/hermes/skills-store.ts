import { randomUUID } from "crypto"
import fs from "fs/promises"
import path from "path"

import type {
  HermesSkillCreateInput,
  HermesSkillRecord,
  HermesSkillUpdateInput,
} from "@/lib/hermes/skills-types"

interface StoreFile {
  skills: HermesSkillRecord[]
}

function storePath(): string {
  return path.join(process.cwd(), "data", "hermes-skills.json")
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true })
}

export async function listSkills(): Promise<HermesSkillRecord[]> {
  try {
    const raw = await fs.readFile(storePath(), "utf8")
    const parsed = JSON.parse(raw) as StoreFile
    return Array.isArray(parsed.skills) ? parsed.skills : []
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException)?.code
    if (code === "ENOENT") return []
    throw e
  }
}

async function writeAll(skills: HermesSkillRecord[]): Promise<void> {
  await ensureDataDir()
  const payload: StoreFile = { skills }
  await fs.writeFile(storePath(), JSON.stringify(payload, null, 2), "utf8")
}

export async function getSkillById(
  id: string
): Promise<HermesSkillRecord | null> {
  const skills = await listSkills()
  return skills.find((s) => s.id === id) ?? null
}

export async function createSkill(
  input: HermesSkillCreateInput
): Promise<HermesSkillRecord> {
  const skills = await listSkills()
  const now = new Date().toISOString()
  const record: HermesSkillRecord = {
    id: randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
    body: input.body,
    createdAt: now,
    updatedAt: now,
  }
  skills.push(record)
  await writeAll(skills)
  return record
}

export async function updateSkill(
  id: string,
  patch: HermesSkillUpdateInput
): Promise<HermesSkillRecord | null> {
  const skills = await listSkills()
  const i = skills.findIndex((s) => s.id === id)
  if (i === -1) return null

  const cur = skills[i]
  const next: HermesSkillRecord = {
    ...cur,
    name:
      patch.name !== undefined ? patch.name.trim() : cur.name,
    description:
      patch.description !== undefined
        ? patch.description.trim()
        : cur.description,
    body: patch.body !== undefined ? patch.body : cur.body,
    updatedAt: new Date().toISOString(),
  }
  skills[i] = next
  await writeAll(skills)
  return next
}

export async function deleteSkill(id: string): Promise<boolean> {
  const skills = await listSkills()
  const next = skills.filter((s) => s.id !== id)
  if (next.length === skills.length) return false
  await writeAll(next)
  return true
}
