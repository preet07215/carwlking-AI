export type ExtractionStatus = "completed" | "running" | "failed"

export interface ExtractionRecord {
  id: string
  url: string
  status: ExtractionStatus
  durationMs: number
  createdAt: string
}

export const mockExtractions: ExtractionRecord[] = [
  {
    id: "1",
    url: "https://shop.example.com/catalog/winter-collection",
    status: "completed",
    durationMs: 4325,
    createdAt: "2026-05-11T14:22:00.000Z",
  },
  {
    id: "2",
    url: "https://news.example.org/tech/quantum-chips-roundup",
    status: "completed",
    durationMs: 2810,
    createdAt: "2026-05-12T09:05:00.000Z",
  },
  {
    id: "3",
    url: "https://docs.enterprise.dev/api/v2/reference",
    status: "completed",
    durationMs: 5102,
    createdAt: "2026-05-12T16:48:00.000Z",
  },
  {
    id: "4",
    url: "https://marketplace.example.net/vendors/organic-produce",
    status: "completed",
    durationMs: 3655,
    createdAt: "2026-05-13T08:12:00.000Z",
  },
]
