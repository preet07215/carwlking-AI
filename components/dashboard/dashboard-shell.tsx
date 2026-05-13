"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

import { SidebarNav } from "@/components/dashboard/sidebar-nav"
import { TopBar } from "@/components/dashboard/top-bar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const titles: Record<string, { title: string; subtitle?: string }> = {
  "/": {
    title: "Extract",
    subtitle: "Extract structured data from any webpage using AI.",
  },
  "/history": {
    title: "History",
    subtitle: "Past runs and exports (placeholder for future integration).",
  },
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const meta = titles[pathname] ?? titles["/"]

  return (
    <div className="relative flex h-dvh max-h-dvh w-full max-w-[100vw] overflow-hidden">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,oklch(0.72_0.18_285_/0.14),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_0%,oklch(0.65_0.15_320_/0.12),transparent_45%),radial-gradient(ellipse_60%_40%_at_0%_100%,oklch(0.58_0.14_260_/0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,oklch(0.45_0.2_285_/0.35),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_0%,oklch(0.4_0.18_320_/0.25),transparent_45%),radial-gradient(ellipse_60%_40%_at_0%_100%,oklch(0.35_0.12_260_/0.2),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 272 }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        className={cn(
          "relative z-30 hidden min-h-0 shrink-0 flex-col self-stretch border-r border-border/60 bg-sidebar/80 backdrop-blur-xl dark:border-white/10 dark:bg-sidebar/50 md:flex"
        )}
      >
        <SidebarNav collapsed={collapsed} />
      </motion.aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col bg-sidebar/95 pt-2 backdrop-blur-xl dark:bg-sidebar/90">
            <SidebarNav
              collapsed={false}
              forceExpanded
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((c) => !c)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-10 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
