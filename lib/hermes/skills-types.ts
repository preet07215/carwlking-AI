export interface HermesSkillRecord {
  id: string
  name: string
  description: string
  /** Markdown body — maps to SKILL.md content below frontmatter */
  body: string
  createdAt: string
  updatedAt: string
}

export interface HermesSkillCreateInput {
  name: string
  description: string
  body: string
}

export interface HermesSkillUpdateInput {
  name?: string
  description?: string
  body?: string
}
