import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { processBookingInquiry, generateContract } from "@/agents/booking"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, artistId, ...data } = await req.json()

  try {
    if (action === "process_inquiry") {
      const response = await processBookingInquiry(artistId, data.inquiry, data.promoterEmail)
      return NextResponse.json({ response })
    }
    if (action === "generate_contract") {
      const contract = await generateContract(artistId, data.bookingId)
      return NextResponse.json({ contract })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
