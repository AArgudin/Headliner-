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

  const items = await prisma.contentItem.findMany({
    where: { artistId },
    orderBy: { scheduledAt: "asc" },
  })
  return NextResponse.json({ items })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, ...data } = await req.json()
  const item = await prisma.contentItem.update({ where: { id }, data })
  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.contentItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
