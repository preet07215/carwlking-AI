import { HermesJobsPanel } from "@/components/hermes/hermes-jobs-panel"

export const metadata = {
  title: "Hermes jobs · PrismLattice",
  description: "Manage Hermes scheduled jobs (Jobs API)",
}

export default function HermesJobsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Hermes jobs</h2>
        <p className="text-muted-foreground">
          List, create, patch, delete, pause, resume, and run jobs through your
          Hermes gateway&apos;s{" "}
          <code className="rounded bg-muted/60 px-1 text-sm">/api/jobs</code>{" "}
          surface (
          <a
            href="https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            API server docs
          </a>
          ).
        </p>
      </div>
      <HermesJobsPanel />
    </div>
  )
}
