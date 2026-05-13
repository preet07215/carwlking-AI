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
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  aria-label="Download result"
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
                  className="rounded-xl"
                  aria-label="Download result"
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
  const [loading, setLoading] = React.useState(false)
  const [getCodeBusy, setGetCodeBusy] = React.useState(false)
  const [schemaOpen, setSchemaOpen] = React.useState(false)
  const records = React.useMemo(
    () => (initialEmpty ? [] : mockExtractions),
    [initialEmpty]
  )

  const reduceMotion = useReducedMotion()

  function handleExtract() {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 2200)
  }

  function handleGetCode() {
    setGetCodeBusy(true)
    window.setTimeout(() => setGetCodeBusy(false), 1200)
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
                placeholder="https://example.com"
                className="h-12 rounded-xl border-border/80 bg-background/50 pl-11 text-base shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/80 focus-visible:border-primary/50 focus-visible:ring-primary/25 dark:bg-black/25 md:h-14 md:text-[0.95rem]"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Paste the live webpage URL to extract from. Headers and sample
              payloads go in the optional upload below—not here.
            </p>
          </div>

          <FileUploadField id="extraction-source-file" />

          <div className="space-y-2">
            <Label
              htmlFor="prompt"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Extraction prompt
            </Label>
            <Textarea
              id="prompt"
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
            <CollapsibleContent className="border-t border-border/60 px-4 pb-4 pt-2 dark:border-white/10 sm:px-5 sm:pb-5">
              <pre className="max-h-48 overflow-auto rounded-xl border border-border/60 bg-background/80 p-4 font-mono text-xs leading-relaxed text-foreground/90 shadow-inner dark:border-white/10 dark:bg-black/40 sm:text-sm">
                <code>{schemaPlaceholder}</code>
              </pre>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-border/60 dark:bg-white/10" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-xs font-medium dark:border-white/10">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.75_0.15_160_/0.9)]" />
                Mode: normal
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs">
                <Link2 className="size-3.5" aria-hidden />
                Depth scan · 5
              </span>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
        {records.length > 0 ? (
          <div className="hidden px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="col-span-3">Type</div>
            <div className="col-span-5">Source</div>
            <div className="col-span-2">Duration</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
        ) : null}
        <RecentExtractions records={records} />
      </motion.section>
    </motion.div>
  )
}
