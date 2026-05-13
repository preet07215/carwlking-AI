export type StreamToolEntry = {
  id: string
  at: number
  kind: "connect" | "tool" | "done" | "error"
  title: string
  detail?: string
}

/** Consume Hermes / OpenAI chat completion SSE (incl. hermes.tool.progress). */
export async function consumeChatCompletionSse(
  response: Response,
  opts: {
    onStructured?: (e: StreamToolEntry) => void
    onTextDelta?: (delta: string) => void
  }
): Promise<string> {
  const { onStructured, onTextDelta } = opts
  const reader = response.body?.getReader()
  if (!reader) {
    onStructured?.({
      id: crypto.randomUUID(),
      at: Date.now(),
      kind: "error",
      title: "No response body",
    })
    return ""
  }

  const decoder = new TextDecoder()
  let buffer = ""
  let assembled = ""

  const emitTool = (raw: string) => {
    let detail = raw.slice(0, 2000)
    try {
      const o = JSON.parse(raw) as Record<string, unknown>
      const msg =
        (typeof o.message === "string" && o.message) ||
        (typeof o.tool === "string" && o.tool) ||
        (typeof o.name === "string" && o.name) ||
        JSON.stringify(o).slice(0, 500)
      detail = typeof msg === "string" ? msg : detail
    } catch {
      /* keep raw */
    }
    onStructured?.({
      id: crypto.randomUUID(),
      at: Date.now(),
      kind: "tool",
      title: "Tool / agent progress",
      detail,
    })
  }

  const handleEventBlock = (block: string) => {
    const lines = block.split("\n").filter((l) => l.length > 0)
    let eventName = ""
    const dataParts: string[] = []
    for (const line of lines) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim()
      else if (line.startsWith("data:")) dataParts.push(line.slice(5).trim())
    }
    const data = dataParts.join("\n")
    if (!data) return

    if (data === "[DONE]") {
      onStructured?.({
        id: crypto.randomUUID(),
        at: Date.now(),
        kind: "done",
        title: "Stream complete",
      })
      return
    }

    if (eventName === "hermes.tool.progress") {
      emitTool(data)
      return
    }

    try {
      const json = JSON.parse(data) as Record<string, unknown>
      const choices = json.choices
      if (Array.isArray(choices) && choices[0]) {
        const d = (choices[0] as Record<string, unknown>).delta as
          | Record<string, unknown>
          | undefined
        if (d && typeof d.content === "string" && d.content) {
          assembled += d.content
          onTextDelta?.(d.content)
        }
      }
    } catch {
      if (eventName) {
        onStructured?.({
          id: crypto.randomUUID(),
          at: Date.now(),
          kind: "tool",
          title: `SSE: ${eventName}`,
          detail: data.slice(0, 500),
        })
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n\n")
    buffer = parts.pop() ?? ""
    for (const block of parts) {
      const trimmed = block.trim()
      if (trimmed) handleEventBlock(trimmed)
    }
  }

  if (buffer.trim()) handleEventBlock(buffer.trim())

  return assembled
}
