import Link from "next/link"

import { GlassPanel } from "@/components/ui/glass-panel"

export const metadata = {
  title: "History · PrismLattice",
  description: "Extraction history (UI placeholder)",
}

/**
 * Internal route — not linked from the sidebar.
 * Preserved for future API-backed history views.
 */
export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">History</h2>
        <p className="text-muted-foreground">
          This route is ready for future pagination, filters, and exports
          once the backend is connected.
        </p>
      </div>
      <GlassPanel className="p-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          No server data yet. Open the{" "}
          <Link
            href="/"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Extract
          </Link>{" "}
          workspace for the full UI-only flow.
        </p>
      </GlassPanel>
    </div>
  )
}
