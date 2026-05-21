import { NextResponse } from "next/server"

import {
  getExtractionOutputBaseDir,
  getExtractionOutputFilenameTemplate,
  isExtractionOutputConfigured,
} from "@/lib/hermes/config"

export async function GET() {
  if (!isExtractionOutputConfigured()) {
    return NextResponse.json({ configured: false })
  }
  const names = getExtractionOutputFilenameTemplate()
  return NextResponse.json({
    configured: true,
    baseDir: getExtractionOutputBaseDir(),
    layout: "{promptSlug}/{runId}/",
    jsonBasename: names?.json,
    csvBasename: names?.csv,
  })
}
