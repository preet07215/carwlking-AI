import { NextResponse } from "next/server"

import { readExtractionOutputAtPath } from "@/lib/extract/read-output-file"

export async function GET(req: Request) {
  const filePath = new URL(req.url).searchParams.get("path")?.trim()
  if (!filePath) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Query "path" is required (absolute path from completion json_file / csv_file).',
      },
      { status: 400 }
    )
  }

  const result = await readExtractionOutputAtPath(filePath)
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status }
    )
  }

  return new NextResponse(new Uint8Array(result.body), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  })
}
