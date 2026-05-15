"use client"

import * as React from "react"
import {
  CalendarClock,
  Loader2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { GlassPanel } from "@/components/ui/glass-panel"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { extractHermesJobId } from "@/lib/hermes/jobs-helpers"

const DEFAULT_NEW_JOB_JSON = `{
  "prompt": "Summarize unread email",
  "schedule": "0 9 * * *"
}`

function jobJsonPretty(job: unknown): string {
  try {
    return JSON.stringify(job, null, 2)
  } catch {
    return String(job)
  }
}

export function HermesJobsPanel() {
  const [jobs, setJobs] = React.useState<unknown[]>([])
  const [listRaw, setListRaw] = React.useState<unknown>(null)
  const [loading, setLoading] = React.useState(true)
  const [listError, setListError] = React.useState<string | null>(null)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createBody, setCreateBody] = React.useState(DEFAULT_NEW_JOB_JSON)
  const [createBusy, setCreateBusy] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const [editOpen, setEditOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [editBody, setEditBody] = React.useState("")
  const [editBusy, setEditBusy] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)

  const [actionBusy, setActionBusy] = React.useState<string | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = React.useState(false)

  const loadJobs = React.useCallback(async () => {
    setListError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/hermes/jobs", { cache: "no-store" })
      const j = (await res.json()) as {
        ok?: boolean
        jobs?: unknown[]
        raw?: unknown
        error?: string
        detail?: string
      }
      if (!res.ok || !j.ok) {
        throw new Error(
          [j.error, j.detail].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`
        )
      }
      setJobs(Array.isArray(j.jobs) ? j.jobs : [])
      setListRaw(j.raw ?? null)
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : "Failed to load jobs")
      setJobs([])
      setListRaw(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  async function onCreate() {
    setCreateError(null)
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(createBody) as Record<string, unknown>
    } catch {
      setCreateError("Body must be valid JSON (Hermes cron-style job object).")
      return
    }
    setCreateBusy(true)
    try {
      const res = await fetch("/api/hermes/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      })
      const j = (await res.json().catch(() => ({}))) as {
        error?: string
        detail?: string
      }
      if (!res.ok) {
        throw new Error(
          [j.error, j.detail].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`
        )
      }
      setCreateOpen(false)
      setCreateBody(DEFAULT_NEW_JOB_JSON)
      await loadJobs()
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Create failed")
    } finally {
      setCreateBusy(false)
    }
  }

  function openEdit(job: unknown) {
    const id = extractHermesJobId(job)
    if (!id) {
      setEditError("Could not read job id from this entry.")
      return
    }
    setEditError(null)
    setEditId(id)
    setEditBody(jobJsonPretty(job))
    setEditOpen(true)
  }

  async function onSavePatch() {
    if (!editId) return
    setEditError(null)
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(editBody) as Record<string, unknown>
    } catch {
      setEditError("Invalid JSON.")
      return
    }
    setEditBusy(true)
    try {
      const res = await fetch(
        `/api/hermes/jobs/${encodeURIComponent(editId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        }
      )
      const j = (await res.json().catch(() => ({}))) as {
        error?: string
        detail?: string
      }
      if (!res.ok) {
        throw new Error(
          [j.error, j.detail].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`
        )
      }
      setEditOpen(false)
      setEditId(null)
      await loadJobs()
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : "Update failed")
    } finally {
      setEditBusy(false)
    }
  }

  async function postAction(
    id: string,
    subpath: "pause" | "resume" | "run"
  ) {
    const key = `${subpath}:${id}`
    setActionBusy(key)
    try {
      const res = await fetch(
        `/api/hermes/jobs/${encodeURIComponent(id)}/${subpath}`,
        { method: "POST" }
      )
      const j = (await res.json().catch(() => ({}))) as {
        error?: string
        detail?: string
      }
      if (!res.ok) {
        throw new Error(
          [j.error, j.detail].filter(Boolean).join(" — ") ||
            `HTTP ${res.status}`
        )
      }
      await loadJobs()
    } catch {
      /* toast optional */
    } finally {
      setActionBusy(null)
    }
  }

  async function onConfirmDelete() {
    if (!deleteId) return
    setDeleteBusy(true)
    try {
      const res = await fetch(
        `/api/hermes/jobs/${encodeURIComponent(deleteId)}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setDeleteId(null)
        await loadJobs()
      }
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <GlassPanel className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hermes jobs API
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Proxies{" "}
              <code className="rounded bg-muted/70 px-1 py-0.5 text-xs">
                GET/POST /api/jobs
              </code>{" "}
              and per-job actions on your gateway (
              <code className="rounded bg-muted/70 px-1 py-0.5 text-xs">
                HERMES_BASE_URL
              </code>
              ). Body shape matches Hermes{" "}
              <code className="rounded bg-muted/70 px-1 py-0.5 text-xs">
                hermes cron
              </code>{" "}
              jobs (prompt, schedule, skills, etc.).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={loading}
              onClick={() => void loadJobs()}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => {
                setCreateError(null)
                setCreateOpen(true)
              }}
            >
              <Plus className="size-4" />
              New job
            </Button>
          </div>
        </div>

        {listError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {listError}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 py-10 text-center dark:border-white/10">
            <CalendarClock className="size-8 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground">
              No jobs returned. Create one or confirm your gateway exposes the
              Jobs API.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {jobs.map((job, idx) => {
              const jobId = extractHermesJobId(job)
              const label = jobId ?? `entry-${idx + 1}`
              return (
                <li
                  key={`${label}-${idx}`}
                  className={cn(
                    "rounded-xl border border-border/60 bg-background/40 p-3 dark:border-white/10 dark:bg-white/[0.03] sm:p-4"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-mono text-xs font-medium text-foreground">
                        {label}
                      </p>
                      {!jobId ? (
                        <p className="text-xs text-amber-700 dark:text-amber-200/90">
                          No <code className="rounded bg-muted/60 px-0.5">job_id</code> /{" "}
                          <code className="rounded bg-muted/60 px-0.5">id</code> field —
                          actions need an id from Hermes.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {jobId ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={actionBusy !== null}
                            onClick={() => void postAction(jobId, "pause")}
                          >
                            {actionBusy === `pause:${jobId}` ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : null}
                            Pause
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={actionBusy !== null}
                            onClick={() => void postAction(jobId, "resume")}
                          >
                            {actionBusy === `resume:${jobId}` ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : null}
                            Resume
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1 bg-primary/90"
                            disabled={actionBusy !== null}
                            onClick={() => void postAction(jobId, "run")}
                          >
                            {actionBusy === `run:${jobId}` ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Play className="size-3.5" />
                            )}
                            Run now
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!jobId}
                            onClick={() => openEdit(job)}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-1"
                            onClick={() => setDeleteId(jobId)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border/50 bg-muted/20 p-2 font-mono text-[0.65rem] leading-relaxed text-muted-foreground">
                    {jobJsonPretty(job)}
                  </pre>
                </li>
              )
            })}
          </ul>
        )}

        {listRaw != null && !loading && jobs.length > 0 ? (
          <details className="rounded-lg border border-border/50 bg-muted/10 text-xs">
            <summary className="cursor-pointer px-3 py-2 font-medium text-muted-foreground">
              Raw list response
            </summary>
            <pre className="max-h-40 overflow-auto border-t border-border/50 p-2 font-mono text-[0.65rem]">
              {jobJsonPretty(listRaw)}
            </pre>
          </details>
        ) : null}
      </GlassPanel>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>New scheduled job</SheetTitle>
            <SheetDescription>
              JSON body forwarded to Hermes{" "}
              <code className="rounded bg-muted/60 px-1 text-xs">
                POST /api/jobs
              </code>
              .
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
            <Label htmlFor="job-create-json">Job JSON</Label>
            <Textarea
              id="job-create-json"
              value={createBody}
              onChange={(e) => setCreateBody(e.target.value)}
              className="min-h-[220px] font-mono text-xs leading-relaxed"
            />
            {createError ? (
              <p className="text-sm text-destructive">{createError}</p>
            ) : null}
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border/60 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void onCreate()}
              disabled={createBusy}
            >
              {createBusy ? "Creating…" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Edit job</SheetTitle>
            <SheetDescription>
              PATCH merges partial updates on{" "}
              <code className="rounded bg-muted/60 px-1 text-xs">
                /api/jobs/{editId ?? "…"}
              </code>
              . Adjust JSON and save.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="min-h-[260px] font-mono text-xs leading-relaxed"
            />
            {editError ? (
              <p className="text-sm text-destructive">{editError}</p>
            ) : null}
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border/60 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={editBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void onSavePatch()}
              disabled={editBusy}
            >
              {editBusy ? "Saving…" : "Save patch"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job?</AlertDialogTitle>
            <AlertDialogDescription>
              Job{" "}
              <code className="rounded bg-muted/60 px-1 text-xs">
                {deleteId}
              </code>{" "}
              will be removed on the gateway (and in-flight run cancelled per
              Hermes).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void onConfirmDelete()
              }}
              disabled={deleteBusy}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
