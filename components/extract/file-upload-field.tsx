"use client"

import * as React from "react"
import { FileText, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const DEFAULT_ACCEPT =
  ".html,.htm,.txt,.md,.json,text/html,text/plain,application/json"

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export interface FileUploadFieldProps {
  id?: string
  accept?: string
  disabled?: boolean
  /** Called when a file is chosen or cleared (null) — for future wiring */
  onFileChange?: (file: File | null) => void
}

export function FileUploadField({
  id = "source-file",
  accept = DEFAULT_ACCEPT,
  disabled = false,
  onFileChange,
}: FileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const syncFile = React.useCallback(
    (next: File | null) => {
      setFile(next)
      onFileChange?.(next)
    },
    [onFileChange]
  )

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    syncFile(f)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    const f = e.dataTransfer.files?.[0] ?? null
    syncFile(f)
  }

  function clearFile(e: React.MouseEvent) {
    e.stopPropagation()
    syncFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        Source file (optional)
      </Label>

      <div
        role="button"
        aria-label="Upload source file"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(false)
          }
        }}
        onDrop={handleDrop}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "group relative flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/80 bg-background/40 px-4 py-6 text-center shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 md:min-h-[148px]",
          "hover:border-primary/40 hover:bg-primary/[0.04]",
          "focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/20",
          dragOver &&
            "border-primary/55 bg-primary/[0.08] shadow-[0_0_0_1px_oklch(0.55_0.22_285_/0.25)]",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={handleInput}
        />

        {file ? (
          <>
            <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2.5 text-left dark:bg-black/30">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-lg"
                aria-label="Remove file"
                onClick={clearFile}
              >
                <X className="size-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tap to replace, or drop another file
            </p>
          </>
        ) : (
          <>
            <div className="flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/40 text-primary shadow-inner transition-transform duration-200 group-hover:scale-105 dark:bg-white/[0.06]">
              <Upload className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drop a file here or click to browse
              </p>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                HTML snapshot, saved page, notes, or JSON bundle — UI only, no
                upload yet.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
