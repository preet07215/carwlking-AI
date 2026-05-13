"use client"

import * as React from "react"
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion"
import {
  Braces,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Link2,
  Loader2,
  Sparkles,
} from "lucide-react"

import { GlassPanel } from "@/components/ui/glass-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import {
  mockExtractions,
  type ExtractionRecord,
  type ExtractionStatus,
} from "@/lib/mock-extractions"
import { FileUploadField } from "@/components/extract/file-upload-field"
import { HermesServerOfflineDialog } from "@/components/extract/hermes-offline-dialog"
import { ExtractStreamProgress } from "@/components/extract/extract-stream-panel"
import {
  consumeChatCompletionSse,
  type StreamToolEntry,
} from "@/lib/extract/sse-client"

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

const schemaPlaceholder = `{
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "price": { "type": "number" },
    "images": {
      "type": "array",
      "items": { "type": "string", "format": "uri" }
    }
  },
  "required": ["title", "price"]
}`

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

function RecentExtractions({ records }: { records: ExtractionRecord[] }) {
  const reduceMotion = useReducedMotion()

  function downloadRow(row: ExtractionRecord) {
    if (!row.resultText) return
    const blob = new Blob([row.resultText], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `extraction-${row.id.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (records.length === 0) {
    return (
      <GlassPanel className="overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 shadow-inner">
            <Sparkles className="size-7 text-primary/80" />
          </div>
          <div className="max-w-sm space-y-2">
            <h3 className="text-lg font-semibold tracking-tight">
              No extractions yet
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Run your first extraction above. Results will appear here with
              timing, status, and one-click export.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl" disabled>
            Connect API (soon)
          </Button>
        </div>
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((row, i) => (
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
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(row.createdAt)}
                </p>
              </div>
              <div className="col-span-2 text-sm tabular-nums text-muted-foreground">
                {row.durationMs}ms
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <Badge
                  variant="outline"
                  className={cn("rounded-lg capitalize", statusBadge(row.status))}
                >
                  {row.status}
                </Badge>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-40"
                  aria-label="Download result"
                  disabled={!row.resultText}
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
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{formatRelativeTime(row.createdAt)}</span>
                <span className="tabular-nums">{row.durationMs}ms</span>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl disabled:opacity-40"
                  aria-label="Download result"
                  disabled={!row.resultText}
                  onClick={() => downloadRow(row)}
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  )
}

export function ExtractDashboard({ initialEmpty }: { initialEmpty?: boolean }) {
  const [targetUrl, setTargetUrl] = React.useState("")
  const [prompt, setPrompt] = React.useState("")
  const [headersFile, setHeadersFile] = React.useState<File | null>(null)
  const [liveRuns, setLiveRuns] = React.useState<ExtractionRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [getCodeBusy, setGetCodeBusy] = React.useState(false)
  const [schemaOpen, setSchemaOpen] = React.useState(false)
  const [schemaText, setSchemaText] = React.useState(schemaPlaceholder)
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
  } | null>(null)
  const [streamEntries, setStreamEntries] = React.useState<StreamToolEntry[]>(
    []
  )
  const [streamingText, setStreamingText] = React.useState("")
  const [streamActive, setStreamActive] = React.useState(false)

  const baseRecords = React.useMemo(
    () => (initialEmpty ? [] : mockExtractions),
    [initialEmpty]
  )

  const displayRecords = React.useMemo(
    () => [...liveRuns, ...baseRecords],
    [liveRuns, baseRecords]
  )

  const reduceMotion = useReducedMotion()

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
    setStreamingText("")
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

    try {
      const res = await fetch("/api/extract/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: u,
          prompt: p,
          headersSample: headersSample || undefined,
          jsonSchema: schemaText.trim() || undefined,
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
        setLiveRuns((prev) => [
          {
            id,
            url: u,
            status: "failed",
            durationMs,
            createdAt,
            resultText: errText,
          },
          ...prev,
        ])
        return
      }

      if (!contentType.includes("text/event-stream")) {
        const fallback = await res.text()
        const durationMs = Date.now() - started
        setStreamActive(false)
        const errText = `Expected event-stream, got: ${contentType}\n${fallback.slice(0, 500)}`
        setLastOutcome({ ok: false, error: errText, durationMs })
        setLiveRuns((prev) => [
          {
            id,
            url: u,
            status: "failed",
            durationMs,
            createdAt,
            resultText: errText,
          },
          ...prev,
        ])
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

      setLastOutcome({
        ok: true,
        content: acc,
        durationMs,
      })
      setLiveRuns((prev) => [
        {
          id,
          url: u,
          status: "completed",
          durationMs,
          createdAt,
          resultText: acc,
        },
        ...prev,
      ])
    } catch (e) {
      const durationMs = Date.now() - started
      const msg = e instanceof Error ? e.message : "Network error"
      setStreamActive(false)
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
        jsonSchema: schemaText.trim() || undefined,
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
    await navigator.clipboard.writeText(lastOutcome.content)
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 sm:gap-10 lg:gap-12"
    >
      <motion.header variants={item} className="relative space-y-4">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20">
            <Sparkles className="size-3.5 text-primary" />
            AI extraction studio
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Extract
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Extract structured data from any webpage using AI.
          </p>
        </div>
      </motion.header>

      <motion.div variants={item}>
        <GlassPanel className="space-y-6 overflow-visible p-5 sm:p-7 lg:p-8">
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
                className="h-12 rounded-xl border-border/80 bg-background/50 pl-11 text-base shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-primary/25 dark:bg-black/25 md:h-14 md:text-[0.95rem]"
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
              className="min-h-[140px] rounded-xl border-border/80 bg-background/50 text-base leading-relaxed shadow-sm transition-[border-color,box-shadow] duration-200 focus-visible:border-primary/50 focus-visible:ring-primary/25 dark:bg-black/25 sm:min-h-[160px] md:min-h-[180px]"
            />
          </div>

          <Collapsible
            open={schemaOpen}
            onOpenChange={setSchemaOpen}
            className="rounded-2xl border border-border/70 bg-muted/25 dark:border-white/10 dark:bg-white/[0.04]"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.06] sm:px-5">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Braces className="size-4 text-primary" />
                Output format (JSON Schema optional)
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  schemaOpen && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 border-t border-border/60 px-4 pb-4 pt-3 dark:border-white/10 sm:px-5 sm:pb-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label
                  htmlFor="output-schema"
                  className="text-xs font-normal text-muted-foreground"
                >
                  Edit JSON Schema — the model is instructed to match it when
                  present.
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-7 shrink-0 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSchemaText(schemaPlaceholder)}
                >
                  Reset example
                </Button>
              </div>
              <Textarea
                id="output-schema"
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                spellCheck={false}
                className="min-h-[200px] max-h-[min(420px,55vh)] w-full resize-y rounded-xl border-border/60 bg-background/80 font-mono text-xs leading-relaxed shadow-inner focus-visible:border-primary/50 focus-visible:ring-primary/25 dark:border-white/10 dark:bg-black/40 sm:text-sm"
                aria-label="JSON Schema output format"
              />
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border/60 dark:bg-white/10" />

          {formError ? (
            <p className="text-sm font-medium text-destructive">{formError}</p>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium dark:border-white/10",
                    hermesStatus === "ok" &&
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                    hermesStatus === "error" &&
                      "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
                    hermesStatus === "checking" &&
                      "border-border/60 bg-background/50 text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      hermesStatus === "ok" &&
                        "bg-emerald-400 shadow-[0_0_8px_oklch(0.75_0.15_160_/0.9)]",
                      hermesStatus === "error" && "bg-amber-400",
                      hermesStatus === "checking" &&
                        "animate-pulse bg-muted-foreground/60"
                    )}
                  />
                  Hermes:{" "}
                  {hermesStatus === "checking"
                    ? "checking…"
                    : hermesStatus === "ok"
                      ? "API reachable"
                      : "API unreachable"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-xs font-medium dark:border-white/10">
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.75_0.15_160_/0.9)]" />
                  Mode: normal
                </span>
                {hermesStatus === "error" ? (
                  <button
                    type="button"
                    className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary hover:bg-primary/15"
                    onClick={() => setOfflineModalOpen(true)}
                  >
                    Server help
                  </button>
                ) : null}
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Link2 className="size-3.5" aria-hidden />
                  Depth scan · 5
                </span>
              </div>

              {hermesHelp && hermesStatus !== "ok" ? (
                <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
                  <p className="font-semibold text-amber-900 dark:text-amber-50">
                    Hermes connection help
                  </p>
                  <pre className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-sans text-[0.8rem] opacity-95">
                    {hermesHelp}
                  </pre>
                </div>
              ) : null}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="h-11 w-full rounded-xl border-border/80 sm:h-10 sm:w-auto"
                onClick={handleGetCode}
                disabled={getCodeBusy}
              >
                {getCodeBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Code2 className="size-4" />
                )}
                Get code
              </Button>
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
        />
      </motion.div>

      {lastOutcome ? (
        <motion.div variants={item}>
          <GlassPanel className="space-y-3 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Last result
              </h3>
              {lastOutcome.ok && lastOutcome.content ? (
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
              ) : null}
            </div>
            {lastOutcome.ok ? (
              <pre className="max-h-[min(360px,50vh)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-background/80 p-4 font-mono text-xs leading-relaxed dark:bg-black/40 sm:text-sm">
                {lastOutcome.content}
              </pre>
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

      <motion.section variants={item} className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent extractions
            </h3>
            <p className="text-sm text-muted-foreground">
              Live telemetry-style history with export shortcuts.
            </p>
          </div>
        </div>
        {/* column headers — desktop only */}
        {displayRecords.length > 0 ? (
          <div className="hidden px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="col-span-3">Type</div>
            <div className="col-span-5">Source</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
        ) : null}
        <RecentExtractions records={displayRecords} />
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
