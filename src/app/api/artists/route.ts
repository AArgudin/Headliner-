import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const artists = await prisma.artist.findMany({
    where: { userId },
    include: {
      _count: { select: { bookings: true, contentItems: true, invoices: true } },
    },
  })
  return NextResponse.json({ artists })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const data = await req.json()
  const artist = await prisma.artist.create({ data: { ...data, userId } })
  return NextResponse.json({ artist })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, ...data } = await req.json()
  const artist = await prisma.artist.update({ where: { id }, data })
  return NextResponse.json({ artist })
}
