"use client"

import * as React from "react"
import { BookMarked, Pencil, Plus, Trash2 } from "lucide-react"

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
import { Input } from "@/components/ui/input"
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
import type { HermesSkillRecord } from "@/lib/hermes/skills-types"

export function HermesSkillsManager() {
  const [skills, setSkills] = React.useState<HermesSkillRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [listError, setListError] = React.useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<HermesSkillRecord | null>(null)
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [body, setBody] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] =
    React.useState<HermesSkillRecord | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const load = React.useCallback(async () => {
    setListError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/hermes/skills", { cache: "no-store" })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { skills?: HermesSkillRecord[] }
      setSkills(Array.isArray(data.skills) ? data.skills : [])
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : "Failed to load skills")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName("")
    setDescription("")
    setBody("")
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(skill: HermesSkillRecord) {
    setEditing(skill)
    setName(skill.name)
    setDescription(skill.description)
    setBody(skill.body)
    setFormError(null)
    setSheetOpen(true)
  }

  async function onSave() {
    setFormError(null)
    if (!name.trim()) {
      setFormError("Name is required.")
      return
    }

    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/hermes/skills/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            body,
          }),
        })
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(j?.error || (await res.text()) || `HTTP ${res.status}`)
        }
      } else {
        const res = await fetch("/api/hermes/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            body,
          }),
        })
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(j?.error || (await res.text()) || `HTTP ${res.status}`)
        }
      }
      setSheetOpen(false)
      await load()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/hermes/skills/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(j?.error || `HTTP ${res.status}`)
      }
      setDeleteTarget(null)
      await load()
    } catch {
      // keep dialog open; could surface toast — keep minimal
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <GlassPanel className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hermes agent
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Define skills as name, summary, and markdown instructions. Data
                is stored under{" "}
                <code className="rounded-md bg-muted/80 px-1.5 py-0.5 text-xs">
                  data/hermes-skills.json
                </code>{" "}
                on this server (Hermes-style SKILL.md fields). Deploy or sync to
                your agent workspace as needed.
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 gap-2"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              New skill
            </Button>
          </div>

          {listError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {listError}
            </p>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading skills…</p>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 py-10 text-center dark:border-white/10">
              <BookMarked className="size-8 text-muted-foreground/70" />
              <p className="text-sm text-muted-foreground">
                No skills yet. Create one to guide the Hermes agent.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {skills.map((s) => (
                <li
                  key={s.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.03]"
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium text-foreground">
                      {s.name}
                    </p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {s.description || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {new Date(s.updatedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setDeleteTarget(s)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>{editing ? "Edit skill" : "New skill"}</SheetTitle>
            <SheetDescription>
              Markdown in the body is sent to the agent as the skill playbook.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Name</Label>
              <Input
                id="skill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. OpenAPI design review"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-desc">Description</Label>
              <Input
                id="skill-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary for listings"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-body">Body (markdown)</Label>
              <Textarea
                id="skill-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Step-by-step instructions, constraints, examples…"
                className="min-h-[220px] font-mono text-xs leading-relaxed"
              />
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border/60 pt-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete skill?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" will be removed from this workspace.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                void onConfirmDelete()
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
