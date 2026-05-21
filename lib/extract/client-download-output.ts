export type ExtractionOutputKind = "json" | "csv"

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim())
    } catch {
      /* ignore */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() ?? null
}

export async function downloadExtractionOutputFile(
  kind: ExtractionOutputKind,
  opts: { filePath: string; slug?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const filePath = opts.filePath.trim()
  if (!filePath) {
    return { ok: false, error: "Missing output file path" }
  }

  const res = await fetch(
    `/api/extract/output-file?path=${encodeURIComponent(filePath)}`
  )
  if (!res.ok) {
    let error = `Download failed (${res.status})`
    try {
      const j = (await res.json()) as { error?: string }
      if (typeof j.error === "string") error = j.error
    } catch {
      /* ignore */
    }
    return { ok: false, error }
  }

  const blob = await res.blob()
  const fromHeader = filenameFromDisposition(
    res.headers.get("Content-Disposition")
  )
  const ext = kind === "json" ? "json" : "csv"
  const slug =
    opts.slug?.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "") ||
    "extraction"
  const filename =
    fromHeader ?? `extraction-${slug}-${Date.now()}.${ext}`

  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
  return { ok: true }
}
