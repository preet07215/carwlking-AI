import { HermesSkillsManager } from "@/components/skills/hermes-skills-manager"

export const metadata = {
  title: "Hermes skills · PrismLattice",
  description: "Create and manage Hermes agent skills",
}

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Hermes skills</h2>
        <p className="text-muted-foreground">
          Full CRUD for skill definitions used with the Hermes agent layout
          (name, description, markdown body).
        </p>
      </div>
      <HermesSkillsManager />
    </div>
  )
}
