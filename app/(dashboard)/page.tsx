import { ExtractDashboard } from "@/components/extract/extract-dashboard"

export default async function ExtractPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>
}) {
  const sp = await searchParams
  const initialEmpty = sp.empty === "1"

  return <ExtractDashboard initialEmpty={initialEmpty} />
}
