import * as React from "react"

import { cn } from "@/lib/utils"

export function GlassPanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/40 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-card/30 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.45)]",
        className
      )}
      {...props}
    />
  )
}
