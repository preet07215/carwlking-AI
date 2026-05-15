"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Activity, CheckCircle2, Loader2, Square, Wrench } from "lucide-react"

import { GlassPanel } from "@/components/ui/glass-panel"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { StreamToolEntry } from "@/lib/extract/sse-client"

export function ExtractStreamProgress({
  active,
  entries,
  liveText,
  requestTimerLabel,
  onStop,
  stopDisabled,
}: {
  active: boolean
  entries: StreamToolEntry[]
  liveText: string
  requestTimerLabel?: string | null
  /** Stops the in-flight SSE / fetch when provided */
  onStop?: () => void
  stopDisabled?: boolean
}) {
  const modelTextScrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = modelTextScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [liveText, active])

  if (!active && entries.length === 0 && !liveText) return null

  return (
    <GlassPanel className="overflow-hidden p-3 sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        {active ? (
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
        ) : (
          <Activity className="size-4 text-muted-foreground" aria-hidden />
        )}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Live stream (SSE)
        </h3>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {active && onStop ? (
            <Button
              type="button"
              variant="destructive"
              size="xs"
              className="h-7 gap-1 rounded-lg px-2"
              disabled={stopDisabled}
              onClick={onStop}
            >
              <Square className="size-3 fill-current" />
              Stop
            </Button>
          ) : null}
          {requestTimerLabel ? (
            <span className="tabular-nums">
              Req{" "}
              <code className="rounded bg-muted/60 px-1 py-0.5">
                {requestTimerLabel}
              </code>
            </span>
          ) : null}
        </span>
      </div>

      <div className="grid min-h-0 gap-3 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/40 dark:bg-black/25">
          <p className="border-b border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            Agent &amp; tool progress
          </p>
          <ScrollArea className="h-[176px] min-h-0 shrink-0 sm:h-[208px]">
            <ul className="space-y-2 p-3">
              <AnimatePresence initial={false}>
                {entries.length === 0 && active ? (
                  <motion.li
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    Waiting for tokens or tool events…
                  </motion.li>
                ) : null}
                {entries.map((e) => (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2 text-xs dark:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-2">
                      {e.kind === "tool" ? (
                        <Wrench className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                      ) : e.kind === "done" ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      ) : e.kind === "error" ? (
                        <span className="text-destructive">!</span>
                      ) : (
                        <Activity className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{e.title}</p>
                        {e.detail ? (
                          <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                            {e.detail}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </ScrollArea>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-background/40 dark:bg-black/25">
          <p className="border-b border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            Model text
            {active ? (
              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                streaming
              </span>
            ) : null}
          </p>
          <div
            ref={modelTextScrollRef}
            className="h-[176px] min-h-0 shrink-0 overflow-y-auto overscroll-contain sm:h-[208px]"
          >
            <pre
              className={cn(
                "whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed text-foreground/95 sm:text-sm",
                !liveText && "text-muted-foreground"
              )}
            >
              {liveText || (active ? "…" : "—")}
            </pre>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
