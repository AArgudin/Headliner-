import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPrCampaign, generatePitchEmail } from "@/agents/pr"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, artistId, ...data } = await req.json()

  try {
    if (action === "create_campaign") {
      const campaign = await createPrCampaign(artistId, data.release, data.type)
      return NextResponse.json({ campaign })
    }
    if (action === "generate_pitch") {
      const pitch = await generatePitchEmail(artistId, data.targetId, data.campaignId)
      return NextResponse.json({ pitch })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
