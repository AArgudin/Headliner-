import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { checkOverdueInvoices, getRevenueStats, createInvoice } from "@/agents/revenue"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, artistId, ...data } = await req.json()

  try {
    if (action === "check_overdue") {
      const actions = await checkOverdueInvoices(artistId)
      return NextResponse.json({ actions })
    }
    if (action === "get_stats") {
      const stats = await getRevenueStats(artistId)
      return NextResponse.json({ stats })
    }
    if (action === "create_invoice") {
      const invoice = await createInvoice(artistId, data)
      return NextResponse.json({ invoice })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
