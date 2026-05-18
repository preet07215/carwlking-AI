/**
 * Set DEBUG_EXTRACT_MODEL=1 (or true) to log which model the extract API resolved
 * for the Hermes chat/completions JSON body. Hermes may still use a server-configured LLM.
 */
export function isExtractModelDebugEnabled(): boolean {
  const v = process.env.DEBUG_EXTRACT_MODEL
  return v === "1" || v === "true"
}

export function logExtractModelDebug(parts: {
  route: string
  requestModel: string | undefined
  payloadModel: string
}): void {
  if (!isExtractModelDebugEnabled()) return
  console.log("[extract-model] ROUTE:", parts.route)
  console.log(
    "[extract-model] REQUEST_MODEL:",
    parts.requestModel ?? "(none — server default)"
  )
  console.log("[extract-model] FINAL_PAYLOAD_MODEL:", parts.payloadModel)
}
