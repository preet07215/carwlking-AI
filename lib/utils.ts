import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** UUID v4 for client ids; works when `crypto.randomUUID` is unavailable (older browsers, some non-HTTPS contexts). */
export function randomUuid(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID()
  }
  if (c && typeof c.getRandomValues === "function") {
    const buf = new Uint8Array(16)
    c.getRandomValues(buf)
    buf[6] = (buf[6] & 0x0f) | 0x40
    buf[8] = (buf[8] & 0x3f) | 0x80
    const h = [...buf].map((b) => b.toString(16).padStart(2, "0")).join("")
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}
