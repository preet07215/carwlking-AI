export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const sec = Math.round((now - then) / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`
  const day = Math.floor(hr / 24)
  if (day < 14) return `${day} day${day === 1 ? "" : "s"} ago`
  const week = Math.floor(day / 7)
  return `${week} week${week === 1 ? "" : "s"} ago`
}
