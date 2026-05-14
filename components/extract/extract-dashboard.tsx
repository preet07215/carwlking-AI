"use client"

import * as React from "react"
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"
import {
  Code2,
  Copy,
  Download,
  Link2,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react"

import { GlassPanel } from "@/components/ui/glass-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import {
  type ExtractionRecord,
  type ExtractionStatus,
} from "@/lib/mock-extractions"
import { FileUploadField } from "@/components/extract/file-upload-field"
import { HermesServerOfflineDialog } from "@/components/extract/hermes-offline-dialog"
import { ExtractStreamProgress } from "@/components/extract/extract-stream-panel"
import { JsonTreeView } from "@/components/extract/json-tree-view"
import {
  consumeChatCompletionSse,
  type StreamToolEntry,
} from "@/lib/extract/sse-client"
import {
  jsonTextForDownload,
  parseAssistantResponse,
} from "@/lib/extract/split-json-response"

async function fetchHermesHealthSignal(): Promise<{
  ok: boolean
  help: string | null
}> {
  try {
    const r = await fetch("/api/hermes/health")
    let j: Record<string, unknown> = {}
    try {
      j = (await r.json()) as Record<string, unknown>
    } catch {
      /* ignore */
    }
    if (r.ok) return { ok: true, help: null }
    const parts = [
      typeof j.error === "string" ? j.error : null,
      typeof j.hint === "string" ? j.hint : null,
      typeof j.origin === "string" ? `Configured base: ${j.origin}` : null,
    ].filter(Boolean)
    return {
      ok: false,
      help: parts.length ? parts.join("\n\n") : "Hermes unreachable (503).",
    }
  } catch {
    return {
      ok: false,
      help:
        "Could not call /api/hermes/health. Is the Next.js dev server running?",
    }
  }
}

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const s = u.hostname
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
    return s.slice(0, 48) || "extraction"
  } catch {
    return "extraction"
  }
}

function formatReqTimer(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(sec / 60)
  const r = sec % 60
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 380, damping: 32 },
  },
}

function statusBadge(status: ExtractionStatus) {
  const map = {
    completed:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    running: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    failed: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  } as const
  return map[status]
}

function truncatePrompt(text: string | undefined, max = 96): string | null {
  if (!text?.trim()) return null
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function RecentExtractions({
  records,
  onRemove,
  removeBusyId,
}: {
  records: ExtractionRecord[]
  onRemove: (id: string) => void
  removeBusyId: string | null
}) {
  const reduceMotion = useReducedMotion()

  function downloadRow(row: ExtractionRecord) {
    if (!row.resultText) return
    const text = jsonTextForDownload(row.resultText)
    if (!text) return
    const blob = new Blob([text], { type: "application/json;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `extraction-${slugFromUrl(row.url)}-${row.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (records.length === 0) {
    return (
      <GlassPanel className="overflow-hidden p-4 sm:p-5">
        <div className="flex flex-col items-center justify-center gap-3 py-6 text-center sm:py-7">
          <div className="flex size-11 items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 shadow-inner">
            <Sparkles className="size-6 text-primary/80" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="text-base font-semibold tracking-tight sm:text-lg">
              No extractions yet
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Run an extraction above. Rows appear here for this session.
            </p>
          </div>
        </div>
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((row, i) => {
        const promptPreview = truncatePrompt(row.prompt)
        return (
        <motion.div
          key={row.id}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: i * 0.04, duration: 0.35 }}
        >
          <GlassPanel className="group relative overflow-hidden transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_oklch(0.45_0.2_285_/0.35)]">
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-fuchsia-500/5" />
            </div>
            {/* Desktop / tablet row */}
            <div className="relative hidden gap-4 p-4 sm:grid sm:grid-cols-12 sm:items-center sm:p-5">
              <div className="col-span-3 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-lg border-primary/25 bg-primary/10 font-medium text-primary"
                >
                  extract
                </Badge>
              </div>
              <div className="col-span-5 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.url}
                </p>
                {promptPreview ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {promptPreview}
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(row.createdAt)}
                </p>
              </div>
              <div className="col-span-2 text-sm tabular-nums text-muted-foreground">
                {row.status === "running" ? "—" : `${row.durationMs}ms`}
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <Badge
                  variant="outline"
                  className={cn("rounded-lg capitalize", statusBadge(row.status))}
                >
                  {row.status}
                </Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:text-destructive disabled:opacity-40"
                  aria-label="Remove from list"
                  disabled={removeBusyId === row.id}
                  onClick={() => onRemove(row.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Download result"
                  disabled={
                    !row.resultText || !jsonTextForDownload(row.resultText)
                  }
                  onClick={() => downloadRow(row)}
                >
                  <Download className="size-4" />
                </Button>
              </div>
            </div>
            {/* Mobile stacked */}
            <div className="relative space-y-3 p-4 sm:hidden">
              <div className="flex items-start justify-between gap-2">
                <Badge
                  variant="outline"
                  className="rounded-lg border-primary/25 bg-primary/10 font-medium text-primary"
                >
                  extract
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("rounded-lg capitalize", statusBadge(row.status))}
                >
                  {row.status}
                </Badge>
              </div>
              <p className="break-all text-sm font-medium leading-snug text-foreground">
                {row.url}
              </p>
              {promptPreview ? (
                <p className="line-clamp-3 text-xs leading-snug text-muted-foreground">
                  {promptPreview}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{formatRelativeTime(row.createdAt)}</span>
                <span className="tabular-nums">
                  {row.status === "running" ? "—" : `${row.durationMs}ms`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl disabled:opacity-40"
                  aria-label="Remove from list"
                  disabled={removeBusyId === row.id}
                  onClick={() => onRemove(row.id)}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl disabled:opacity-40"
                  aria-label="Download result"
                  disabled={
                    !row.resultText || !jsonTextForDownload(row.resultText)
                  }
                  onClick={() => downloadRow(row)}
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
        )
      })}
    </div>
  )
}

export function ExtractDashboard() {
  const [targetUrl, setTargetUrl] = React.useState("")
  const [prompt, setPrompt] = React.useState("")
  const [headersFile, setHeadersFile] = React.useState<File | null>(null)
  const [liveRuns, setLiveRuns] = React.useState<ExtractionRecord[]>([])
  const [storedHistory, setStoredHistory] = React.useState<ExtractionRecord[]>(
    []
  )
  const [historyConfigured, setHistoryConfigured] = React.useState(false)
  const [historyClearing, setHistoryClearing] = React.useState(false)
  const [removeBusyId, setRemoveBusyId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [getCodeBusy, setGetCodeBusy] = React.useState(false)
  const [hermesStatus, setHermesStatus] = React.useState<
    "checking" | "ok" | "error"
  >("checking")
  const [hermesHelp, setHermesHelp] = React.useState<string | null>(null)
  const [offlineModalOpen, setOfflineModalOpen] = React.useState(false)
  const [healthRetrying, setHealthRetrying] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [lastOutcome, setLastOutcome] = React.useState<{
    ok: boolean
    content?: string
    error?: string
    durationMs?: number
    sourceUrl?: string
  } | null>(null)
  const [streamEntries, setStreamEntries] = React.useState<StreamToolEntry[]>(
    []
  )
  const [streamingText, setStreamingText] = React.useState("")
  const [streamActive, setStreamActive] = React.useState(false)
  const [streamStartedAt, setStreamStartedAt] = React.useState<number | null>(
    null
  )
  const [streamTick, setStreamTick] = React.useState(0)

  const requestTimerLabel = React.useMemo(() => {
    if (streamActive && streamStartedAt !== null) {
      void streamTick
      return formatReqTimer((Date.now() - streamStartedAt) / 1000)
    }
    if (lastOutcome?.durationMs != null) {
      return formatReqTimer(lastOutcome.durationMs / 1000)
    }
    return null
  }, [
    streamActive,
    streamStartedAt,
    lastOutcome?.durationMs,
    streamTick,
  ])

  React.useEffect(() => {
    if (!streamActive || streamStartedAt === null) return
    const id = window.setInterval(() => setStreamTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [streamActive, streamStartedAt])

  const lastSplit = React.useMemo(() => {
    if (!lastOutcome?.ok || !lastOutcome.content) return null
    return parseAssistantResponse(lastOutcome.content)
  }, [lastOutcome?.ok, lastOutcome?.content])

  const displayRecords = React.useMemo(() => {
    if (!historyConfigured) {
      return [...liveRuns].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    const map = new Map<string, ExtractionRecord>()
    for (const r of storedHistory) map.set(r.id, r)
    for (const r of liveRuns) map.set(r.id, r)
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [liveRuns, storedHistory, historyConfigured])

  const reduceMotion = useReducedMotion()

  async function persistExtraction(record: ExtractionRecord) {
    try {
      const r = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      })
      if (!r.ok) return
      const j = (await r.json()) as { item?: ExtractionRecord }
      if (j.item) {
        const saved = j.item
        setHistoryConfigured(true)
        setStoredHistory((prev) => [
          saved,
          ...prev.filter((x) => x.id !== saved.id),
        ])
      }
    } catch {
      /* ignore */
    }
  }

  function commitRun(record: ExtractionRecord) {
    setLiveRuns((prev) => {
      const rest = prev.filter((x) => x.id !== record.id)
      return [record, ...rest]
    })
    void persistExtraction(record)
  }

  async function removeRecord(id: string) {
    setRemoveBusyId(id)
    try {
      const r = await fetch(`/api/history/${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (r.ok || r.status === 503) {
        setStoredHistory((prev) => prev.filter((x) => x.id !== id))
        setLiveRuns((prev) => prev.filter((x) => x.id !== id))
      }
    } finally {
      setRemoveBusyId(null)
    }
  }

  async function clearCloudHistory() {
    if (!historyConfigured) return
    if (
      !window.confirm(
        "Remove all extractions stored in Supabase? This cannot be undone."
      )
    ) {
      return
    }
    setHistoryClearing(true)
    try {
      const r = await fetch("/api/history", { method: "DELETE" })
      if (r.ok) setStoredHistory([])
    } finally {
      setHistoryClearing(false)
    }
  }

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await fetch("/api/history")
      const j = (await r.json().catch(() => ({
        configured: false,
        items: [],
      }))) as { configured?: boolean; items?: ExtractionRecord[] }
      if (cancelled) return
      setHistoryConfigured(Boolean(j.configured))
      if (j.configured && Array.isArray(j.items)) {
        setStoredHistory(j.items)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { ok, help } = await fetchHermesHealthSignal()
      if (cancelled) return
      setHermesStatus(ok ? "ok" : "error")
      setHermesHelp(ok ? null : help)
      if (!ok) setOfflineModalOpen(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleHermesHealthRetry() {
    setHealthRetrying(true)
    setHermesStatus("checking")
    const { ok, help } = await fetchHermesHealthSignal()
    setHermesStatus(ok ? "ok" : "error")
    setHermesHelp(ok ? null : help)
    setOfflineModalOpen(!ok)
    setHealthRetrying(false)
  }

  async function handleExtract() {
    const u = targetUrl.trim()
    const p = prompt.trim()
    if (!u || !p) {
      setFormError("Target URL and extraction prompt are both required.")
      return
    }
    setFormError(null)
    setLastOutcome(null)
    setStreamEntries([])
    setStreamingText(
      "Starting — live steps and model tokens will appear here as they arrive.\n\n"
    )
    setStreamActive(true)
    setLoading(true)

    let headersSample: string | undefined
    if (headersFile) {
      try {
        headersSample = await headersFile.text()
      } catch {
        setFormError("Could not read the headers / sample file.")
        setLoading(false)
        setStreamActive(false)
        return
      }
    }

    const started = Date.now()
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    setStreamEntries([
      {
        id: crypto.randomUUID(),
        at: Date.now(),
        kind: "connect",
        title: "Opening SSE stream",
        detail:
          "POST /api/extract/stream → Hermes /v1/chat/completions (stream: true)",
      },
    ])

    commitRun({
      id,
      url: u,
      status: "running",
      durationMs: 0,
      createdAt,
      prompt: p,
    })
    setStreamStartedAt(Date.now())

    try {
      const res = await fetch("/api/extract/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: u,
          prompt: p,
          headersSample: headersSample || undefined,
        }),
      })

      const contentType = res.headers.get("content-type") ?? ""

      if (!res.ok) {
        let data = {} as Record<string, unknown>
        try {
          data = (await res.json()) as Record<string, unknown>
        } catch {
          /* ignore */
        }
        const errText = [
          typeof data.error === "string" ? data.error : `HTTP ${res.status}`,
          typeof data.detail === "string" ? data.detail : "",
          typeof data.hint === "string" ? data.hint : "",
        ]
          .filter(Boolean)
          .join("\n\n")

        const durationMs = Date.now() - started

        if (res.status === 503) {
          setHermesStatus("error")
          setHermesHelp(
            errText ||
              "Hermes unreachable. Start the gateway and match HERMES_API_KEY."
          )
          setOfflineModalOpen(true)
        }

        setStreamActive(false)
        setStreamStartedAt(null)
        setStreamEntries((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            at: Date.now(),
            kind: "error",
            title: "Stream aborted",
            detail: errText.slice(0, 1500),
          },
        ])
        setLastOutcome({ ok: false, error: errText, durationMs })
        commitRun({
          id,
          url: u,
          status: "failed",
          durationMs,
          createdAt,
          prompt: p,
          resultText: errText,
        })
        return
      }

      if (!contentType.includes("text/event-stream")) {
        const fallback = await res.text()
        const durationMs = Date.now() - started
        setStreamActive(false)
        setStreamStartedAt(null)
        const errText = `Expected event-stream, got: ${contentType}\n${fallback.slice(0, 500)}`
        setLastOutcome({ ok: false, error: errText, durationMs })
        commitRun({
          id,
          url: u,
          status: "failed",
          durationMs,
          createdAt,
          prompt: p,
          resultText: errText,
        })
        return
      }

      const acc = await consumeChatCompletionSse(res, {
        onStructured: (e) => {
          setStreamEntries((prev) => [...prev, e])
        },
        onTextDelta: (delta) => {
          setStreamingText((prev) => prev + delta)
        },
      })

      const durationMs = Date.now() - started
      setStreamActive(false)
      setStreamStartedAt(null)

      setLastOutcome({
        ok: true,
        content: acc,
        durationMs,
        sourceUrl: u,
      })
      commitRun({
        id,
        url: u,
        status: "completed",
        durationMs,
        createdAt,
        prompt: p,
        resultText: acc,
      })
    } catch (e) {
      const durationMs = Date.now() - started
      const msg = e instanceof Error ? e.message : "Network error"
      setStreamActive(false)
      setStreamStartedAt(null)
      setStreamEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          at: Date.now(),
          kind: "error",
          title: "Client stream error",
          detail: msg,
        },
      ])
      setLastOutcome({ ok: false, error: msg, durationMs })
      commitRun({
        id,
        url: u,
        status: "failed",
        durationMs,
        createdAt,
        prompt: p,
        resultText: msg,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleGetCode() {
    setGetCodeBusy(true)
    try {
      const example = {
        targetUrl: targetUrl.trim() || "https://example.com",
        prompt:
          prompt.trim() ||
          "Extract the main product title and price as JSON.",
        headersSample: "// optional: paste HAR / headers text",
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : ""
      const snippet = `// Streaming: POST /api/extract/stream → Hermes SSE (stream: true)
const res = await fetch("${origin}/api/extract/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: ${JSON.stringify(JSON.stringify(example))},
})
if (!res.ok) {
  const err = await res.json().catch(() => ({}))
  throw new Error(err.error ?? "Stream failed")
}
const reader = res.body?.getReader()
const dec = new TextDecoder()
let buf = ""
let text = ""
while (reader) {
  const { done, value } = await reader.read()
  if (done) break
  buf += dec.decode(value, { stream: true })
  const blocks = buf.split("\\n\\n")
  buf = blocks.pop() ?? ""
  for (const b of blocks) {
    for (const line of b.split("\\n")) {
      if (!line.startsWith("data:")) continue
      const data = line.slice(5).trim()
      if (data === "[DONE]") continue
      try {
        const j = JSON.parse(data)
        const d = j.choices?.[0]?.delta?.content
        if (typeof d === "string") text += d
      } catch { /* ignore */ }
    }
  }
}
console.log(text)`
      await navigator.clipboard.writeText(snippet)
    } finally {
      window.setTimeout(() => setGetCodeBusy(false), 400)
    }
  }

  async function copyResult() {
    if (!lastOutcome?.ok || !lastOutcome.content) return
    const jsonOnly = jsonTextForDownload(lastOutcome.content)
    await navigator.clipboard.writeText(
      jsonOnly ?? lastOutcome.content
    )
  }

  function downloadLastResultJson() {
    if (!lastOutcome?.ok || !lastOutcome.content) return
    const text = jsonTextForDownload(lastOutcome.content)
    if (!text) return
    const blob = new Blob([text], { type: "application/json;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    const slug = slugFromUrl(lastOutcome.sourceUrl ?? targetUrl)
    a.download = `extraction-${slug}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 sm:gap-5 lg:gap-6"
    >
      <motion.header variants={item} className="relative space-y-2">
        <div
          className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-80 blur-3xl"
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-primary/45 via-fuchsia-500/35 to-cyan-400/25 dark:from-primary/55 dark:via-fuchsia-500/40 dark:to-cyan-400/30"
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: [0.45, 0.75, 0.45],
                    scale: [1, 1.02, 1],
                  }
            }
            transition={
              reduceMotion ? undefined : { duration: 10, repeat: Infinity }
            }
          />
        </div>
        <div className="space-y-2">
          
          <h3 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Extract
              {/* <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20">
              <Sparkles className="size-3.5 text-primary ml-2" />
                AI extraction studio
              </div> */}
          </h3>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Extract structured data from any webpage.
          </p>
        </div>
      </motion.header>

      <motion.div variants={item}>
        <GlassPanel className="space-y-4 overflow-visible p-4 sm:p-5 lg:p-6">
          <div className="space-y-2">
            <Label
              htmlFor="url"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Target URL
            </Label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com"
                className="h-11 rounded-xl border-border/80 bg-background/50 pl-11 text-base shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-primary/25 dark:bg-black/25 md:h-12 md:text-[0.95rem]"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Paste the live webpage URL to extract from. Headers and sample
              payloads go in the optional upload below—not here.
            </p>
          </div>

          <FileUploadField
            id="extraction-source-file"
            onFileChange={setHeadersFile}
          />

          <div className="space-y-2">
            <Label
              htmlFor="prompt"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Extraction prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Extract product title, price, description, images, SKU, and specifications..."
              className="min-h-[112px] rounded-xl border-border/80 bg-background/50 text-base leading-relaxed shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:border-primary/50 focus-visible:ring-primary/25 dark:bg-black/25 sm:min-h-[128px] md:min-h-[144px]"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Describe what to capture; the model is instructed to answer with
              valid JSON only (no markdown fences). After a run, use{" "}
              <span className="font-medium text-foreground/85">Download JSON</span>{" "}
              to save the response.
            </p>
          </div>

          <Separator className="bg-border/60 dark:bg-white/10" />

          {formError ? (
            <p className="text-sm font-medium text-destructive">{formError}</p>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">

            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              >
                <Button
                  size="lg"
                  disabled={loading}
                  onClick={handleExtract}
                  className="relative h-11 w-full overflow-hidden rounded-xl border-0 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 px-6 text-primary-foreground shadow-[0_8px_28px_-6px_oklch(0.45_0.28_285_/0.65)] transition-[filter] hover:brightness-110 focus-visible:ring-primary/40 sm:h-10"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 font-semibold">
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Start extraction
                  </span>
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={
                      reduceMotion
                        ? undefined
                        : loading
                          ? { x: ["-100%", "100%"] }
                          : { x: "-100%" }
                    }
                    transition={{
                      duration: 1.2,
                      repeat: loading ? Infinity : 0,
                      ease: "linear",
                    }}
                  />
                </Button>
              </motion.div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      <motion.div variants={item}>
        <ExtractStreamProgress
          active={streamActive}
          entries={streamEntries}
          liveText={streamingText}
          requestTimerLabel={requestTimerLabel}
        />
      </motion.div>

      {lastOutcome ? (
        <motion.div variants={item}>
          <GlassPanel className="space-y-3 overflow-hidden p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Last result
                </h3>
                {lastOutcome.ok ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    JSON is shown in the tree view; anything outside the parsed
                    value appears under{" "}
                    <span className="font-medium text-foreground/85">
                      Extra text
                    </span>
                    . Download includes{" "}
                    <span className="font-medium text-foreground/85">
                      JSON only
                    </span>
                    .
                  </p>
                ) : null}
              </div>
              {lastOutcome.ok && lastOutcome.content ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-lg"
                    onClick={() => void copyResult()}
                  >
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5 rounded-lg bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-40"
                    disabled={!lastSplit?.prettyJson}
                    onClick={downloadLastResultJson}
                  >
                    <Download className="size-3.5" />
                    Download JSON
                  </Button>
                </div>
              ) : null}
            </div>
            {lastOutcome.ok ? (
              <div className="space-y-5">
                {lastSplit?.parsed != null ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      JSON
                    </p>
                    <JsonTreeView parsed={lastSplit.parsed} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      Response (no parseable JSON)
                    </p>
                    <pre className="max-h-[min(360px,50vh)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-background/80 p-4 font-mono text-xs leading-relaxed dark:bg-black/40 sm:text-sm">
                      {lastOutcome.content}
                    </pre>
                  </div>
                )}
                {lastSplit?.parsed != null &&
                (lastSplit.extraBefore || lastSplit.extraAfter) ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Extra text
                    </p>
                    {lastSplit.extraBefore ? (
                      <div className="space-y-1">
                        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                          Before JSON
                        </p>
                        <pre className="max-h-[min(200px,32vh)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/50 bg-muted/35 p-3 font-mono text-xs leading-relaxed text-foreground/90 dark:bg-black/25 sm:text-sm">
                          {lastSplit.extraBefore}
                        </pre>
                      </div>
                    ) : null}
                    {lastSplit.extraAfter ? (
                      <div className="space-y-1">
                        <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                          After JSON
                        </p>
                        <pre className="max-h-[min(200px,32vh)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/50 bg-muted/35 p-3 font-mono text-xs leading-relaxed text-foreground/90 dark:bg-black/25 sm:text-sm">
                          {lastSplit.extraAfter}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <pre className="max-h-[min(280px,40vh)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-destructive/30 bg-destructive/5 p-4 font-mono text-xs text-destructive sm:text-sm">
                {lastOutcome.error}
              </pre>
            )}
            {lastOutcome.durationMs != null ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                {lastOutcome.durationMs}ms — Hermes{" "}
                <code className="rounded bg-muted/50 px-1">/v1/chat/completions</code>{" "}
                (via this app&apos;s API route)
              </p>
            ) : null}
          </GlassPanel>
        </motion.div>
      ) : null}

      <motion.section variants={item} className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent extractions
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:justify-end">
            {historyConfigured ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 rounded-xl"
                disabled={
                  historyClearing || storedHistory.length === 0
                }
                onClick={() => void clearCloudHistory()}
              >
                {historyClearing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Clear cloud history
              </Button>
            ) : null}
          </div>
        </div>
        {/* column headers — desktop only */}
        {displayRecords.length > 0 ? (
          <div className="hidden px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="col-span-3">Type</div>
            <div className="col-span-5">Source</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        ) : null}
        <RecentExtractions
          records={displayRecords}
          onRemove={removeRecord}
          removeBusyId={removeBusyId}
        />
      </motion.section>

      <HermesServerOfflineDialog
        open={offlineModalOpen}
        onOpenChange={setOfflineModalOpen}
        helpText={hermesHelp}
        onRetry={handleHermesHealthRetry}
        retrying={healthRetrying}
      />
    </motion.div>
  )
}
