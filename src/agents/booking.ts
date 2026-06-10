import { runAgent } from "@/lib/anthropic"
import { prisma } from "@/lib/prisma"

export async function processBookingInquiry(
  artistId: string,
  inquiryText: string,
  promoterEmail: string
) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  if (!artist) throw new Error("Artist not found")

  const system = `You are the booking agent for ${artist.name}, a ${artist.genre} DJ based in ${artist.city}.
Your job is to respond to booking inquiries professionally, in the artist's voice — confident, direct, culture-rooted.
The artist's standard booking fee is $${artist.bookingFee}.
Always confirm availability request, quote the fee, explain what's included (DJ set, sound/lighting requirements), and provide next steps.
Keep responses under 150 words. No fluff. Sound like a real booking agent, not a template.
Return ONLY the email response text, no subject line or metadata.`

  const response = await runAgent(
    system,
    `New booking inquiry from ${promoterEmail}:\n\n${inquiryText}`,
    500
  )

  // Log the action
  await prisma.agentLog.create({
    data: {
      artistId,
      agentType: "booking",
      action: "Processed booking inquiry",
      details: `From: ${promoterEmail} | Auto-response drafted`,
      status: "success",
    },
  })

  return response
}

export async function generateContract(
  artistId: string,
  bookingId: string
) {
  const [artist, booking] = await Promise.all([
    prisma.artist.findUnique({ where: { id: artistId } }),
    prisma.booking.findUnique({ where: { id: bookingId } }),
  ])
  if (!artist || !booking) throw new Error("Not found")

  const system = `You are a music industry contract specialist. Generate a professional DJ performance contract.
Format it cleanly with clear sections. Be specific about terms, payment, cancellation policy.
Use plain English — no legalese. The contract should protect the artist.`

  const contract = await runAgent(
    system,
    `Generate a performance contract for:
Artist: ${artist.name}
Venue: ${booking.venue}
Promoter/Client: ${booking.promoter}
Event Date: ${new Date(booking.eventDate).toLocaleDateString()}
Performance Fee: $${booking.fee}
Include: 50% deposit due on signing, remaining 50% day of show. 
Cancellation: client cancels within 7 days = full fee owed. Artist cancels = deposit returned.
Technical rider: Standard DJ setup (CDJs or equivalent, mixer, monitor, basic lighting).`,
    2000
  )

  await prisma.agentLog.create({
    data: {
      artistId,
      agentType: "booking",
      action: "Generated performance contract",
      details: `Booking: ${booking.venue} on ${new Date(booking.eventDate).toLocaleDateString()}`,
      status: "success",
    },
  })

  return contract
}

export async function getBookingStats(artistId: string) {
  const [total, confirmed, pending, revenue] = await Promise.all([
    prisma.booking.count({ where: { artistId } }),
    prisma.booking.count({ where: { artistId, status: "confirmed" } }),
    prisma.booking.count({ where: { artistId, status: "inquiry" } }),
    prisma.booking.aggregate({
      where: { artistId, status: { in: ["confirmed", "completed"] } },
      _sum: { fee: true },
    }),
  ])

  return {
    total,
    confirmed,
    pending,
    revenue: revenue._sum.fee || 0,
  }
}
