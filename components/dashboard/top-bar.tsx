"use client"

import { Menu, PanelLeftClose, PanelLeft } from "lucide-react"

import { ThemeToggle } from "@/components/dashboard/theme-toggle"
import { Button } from "@/components/ui/button"

interface TopBarProps {
  title: string
  subtitle?: string
  onMenuClick: () => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function TopBar({
  title,
  subtitle,
  onMenuClick,
  sidebarCollapsed,
  onToggleSidebar,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-background/70 backdrop-blur-xl dark:border-white/10 dark:bg-background/55">
      <div className="flex min-h-14 flex-col gap-3 px-3 py-3 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden shrink-0 md:inline-flex"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="hidden truncate text-sm text-muted-foreground sm:block">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <a
            href="#"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline"
            onClick={(e) => e.preventDefault()}
          >
            Book a call
          </a>
          <Button
            size="sm"
            className="h-8 rounded-lg bg-gradient-to-r from-primary to-fuchsia-500 px-3 text-primary-foreground shadow-[0_4px_20px_-4px_oklch(0.45_0.25_285_/0.55)] transition-all hover:brightness-110 active:translate-y-px"
          >
            Upgrade
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
