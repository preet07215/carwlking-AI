"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Hexagon, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarNavProps {
  collapsed: boolean
  onNavigate?: () => void
  /** When true, show full labels (e.g. mobile sheet) regardless of collapsed */
  forceExpanded?: boolean
}

export function SidebarNav({
  collapsed,
  onNavigate,
  forceExpanded,
}: SidebarNavProps) {
  const pathname = usePathname()
  const showLabels = forceExpanded || !collapsed
  const extractActive = pathname === "/" || pathname.startsWith("/extract")

  return (
    <ScrollArea className="h-full">
      <div className="flex h-full min-h-0 flex-col gap-8 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-sidebar-accent/80",
            collapsed && !forceExpanded && "justify-center px-0"
          )}
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-fuchsia-500/80 text-primary-foreground shadow-[0_4px_20px_-4px_oklch(0.5_0.25_285_/0.55)]">
            <Hexagon className="size-5 opacity-95" strokeWidth={1.5} />
            <Sparkles className="absolute -right-0.5 -top-0.5 size-3 text-amber-200/90" />
          </div>
          {showLabels && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                PrismLattice
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Enterprise AI
              </p>
            </motion.div>
          )}
        </Link>

        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            onClick={onNavigate}
            className={cn(
              buttonVariants({
                variant: extractActive ? "secondary" : "ghost",
                size: "default",
              }),
              "h-10 w-full justify-start gap-2 rounded-xl border border-transparent transition-all",
              extractActive &&
                "border-primary/15 bg-gradient-to-r from-primary/12 to-fuchsia-500/8 shadow-[inset_0_1px_0_0_oklch(1_0_0_/0.06)] dark:from-primary/20 dark:to-fuchsia-500/10",
              collapsed && !forceExpanded && "size-10 px-0"
            )}
          >
            <Sparkles
              className={cn(
                "size-4 shrink-0",
                extractActive && "text-primary"
              )}
            />
            {showLabels && (
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  extractActive && "text-foreground"
                )}
              >
                Extract
              </span>
            )}
          </Link>
        </nav>

        {showLabels && (
          <div className="mt-auto rounded-xl border border-dashed border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]">
            <p className="font-medium text-foreground/90">Pro workspace</p>
            <p className="mt-1 leading-relaxed">
              Fine-tuned models, SSO, and audit logs—coming soon.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
