import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const artistId = searchParams.get("artistId")
  if (!artistId) return NextResponse.json({ error: "artistId required" }, { status: 400 })

  const brief = await prisma.weeklyBrief.findFirst({
    where: { artistId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ brief })
}
