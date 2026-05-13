"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function JsonTreeValue({
  value,
  depth,
}: {
  value: unknown
  depth: number
}) {
  const pad = depth * 14

  if (value === null) {
    return (
      <span className="text-violet-500 dark:text-violet-400">null</span>
    )
  }
  if (typeof value === "boolean") {
    return (
      <span className="text-amber-600 dark:text-amber-400">
        {value ? "true" : "false"}
      </span>
    )
  }
  if (typeof value === "number") {
    return (
      <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
        {String(value)}
      </span>
    )
  }
  if (typeof value === "string") {
    return (
      <span className="inline-block max-w-full break-all text-sky-700 dark:text-sky-300">
        &quot;
        {value}
        &quot;
      </span>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">[]</span>
    }
    return (
      <span className="block min-w-0">
        <span className="text-muted-foreground">[</span>
        {value.map((item, i) => (
          <span key={i} className="block min-w-0" style={{ paddingLeft: pad + 14 }}>
            <JsonTreeValue value={item} depth={depth + 1} />
            {i < value.length - 1 ? (
              <span className="text-muted-foreground">,</span>
            ) : null}
          </span>
        ))}
        <span className="text-muted-foreground">]</span>
      </span>
    )
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return <span className="text-muted-foreground">{"{}"}</span>
    }
    return (
      <span className="block min-w-0">
        <span className="text-muted-foreground">{"{"}</span>
        {entries.map(([k, v], i) => (
          <span key={`${k}-${i}`} className="block min-w-0" style={{ paddingLeft: pad + 14 }}>
            <span className="inline align-top font-medium text-cyan-700 dark:text-cyan-400">
              &quot;{k}&quot;
            </span>
            <span className="text-muted-foreground">: </span>
            <span className="inline min-w-0 align-top">
              <JsonTreeValue value={v} depth={depth + 1} />
            </span>
            {i < entries.length - 1 ? (
              <span className="text-muted-foreground">,</span>
            ) : null}
          </span>
        ))}
        <span className="text-muted-foreground">{"}"}</span>
      </span>
    )
  }

  return (
    <span className="text-muted-foreground italic">
      {String(value)}
    </span>
  )
}

export function JsonTreeView({
  parsed,
  className,
}: {
  parsed: unknown
  className?: string
}) {
  return (
    <div
      className={cn(
        "isolate w-full min-w-0 max-w-full rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] dark:border-emerald-500/25 dark:bg-emerald-950/30",
        className
      )}
    >
      <div
        className="max-h-[min(360px,50vh)] overflow-x-auto overflow-y-auto overscroll-contain"
        tabIndex={0}
      >
        <div className="w-max min-w-full p-4 font-mono text-xs leading-relaxed sm:text-[0.8rem]">
          <JsonTreeValue value={parsed} depth={0} />
        </div>
      </div>
    </div>
  )
}
