"use client"

import { Loader2, RefreshCw, ServerOff } from "lucide-react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface HermesServerOfflineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  helpText: string | null
  onRetry: () => void | Promise<void>
  retrying: boolean
}

export function HermesServerOfflineDialog({
  open,
  onOpenChange,
  helpText,
  onRetry,
  retrying,
}: HermesServerOfflineDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true)
      }}
    >
      <AlertDialogContent className="max-w-md gap-4 border-border/80 shadow-2xl sm:max-w-lg">
        <AlertDialogHeader className="text-left sm:text-left">
          <AlertDialogMedia
            className={cn(
              "size-12 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/20 to-fuchsia-500/15 text-primary shadow-inner"
            )}
          >
            <ServerOff className="size-6" aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight">
            Hermes backend unavailable (503)
          </AlertDialogTitle>
          <AlertDialogDescription
            className="text-left"
            render={<div />}
          >
            <span className="mb-3 block text-foreground/90">
              Next.js is running, but it cannot reach the Hermes API at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                127.0.0.1:8642
              </code>
              . Start the gateway, match your API key, then check again.
            </span>
            {helpText ? (
              <pre className="max-h-44 overflow-y-auto rounded-xl border border-border/60 bg-muted/40 p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-foreground/90 dark:bg-black/35">
                {helpText}
              </pre>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="border-t-0 bg-transparent pt-0 sm:justify-end">
          <Button
            type="button"
            className="rounded-xl bg-gradient-to-r from-primary to-violet-600 text-primary-foreground shadow-lg hover:opacity-95"
            disabled={retrying}
            onClick={() => void onRetry()}
          >
            {retrying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Check connection
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
