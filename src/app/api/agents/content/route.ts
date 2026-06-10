import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateContentBatch, generateSinglePost } from "@/agents/content"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { action, artistId, ...data } = await req.json()

  try {
    if (action === "generate_batch") {
      const posts = await generateContentBatch(artistId, data.count || 7)
      return NextResponse.json({ posts })
    }
    if (action === "generate_single") {
      const post = await generateSinglePost(artistId, data.context)
      return NextResponse.json({ post })
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
