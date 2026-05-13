"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex h-8 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2",
          className
        )}
        aria-hidden
      >
        <span className="size-4" />
        <span className="h-[18px] w-8 rounded-full bg-muted" />
      </div>
    )
  }

  const dark = resolvedTheme === "dark"

  return (
    <div
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 dark:bg-white/[0.06]",
        className
      )}
    >
      <Sun className="size-3.5 text-amber-500/90" aria-hidden />
      <Switch
        checked={dark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      />
      <Moon className="size-3.5 text-violet-300/90" aria-hidden />
    </div>
  )
}
