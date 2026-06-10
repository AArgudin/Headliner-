import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@roster.app" },
    update: {},
    create: {
      email: "demo@roster.app",
      name: "AJ",
    },
  })

  // Create demo artist
  const artist = await prisma.artist.upsert({
    where: { id: "demo-artist-1" },
    update: {},
    create: {
      id: "demo-artist-1",
      userId: user.id,
      name: "DJ Fernandez",
      genre: "Electronic / House",
      city: "Miami, FL",
      bio: "Miami-based DJ and producer specialising in deep house and tech house. Resident at LIV Miami. Known for high-energy sets that blend underground sounds with peak-time energy.",
      email: "booking@djfernandez.com",
      instagram: "@djfernandez",
      tiktok: "@djfernandez",
      bookingFee: 1500,
    },
  })

  // Seed bookings
  await prisma.booking.createMany({
    skipDuplicates: true,
    data: [
      {
        artistId: artist.id,
        promoter: "LIV Miami",
        venue: "LIV Miami",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        fee: 2500,
        status: "confirmed",
      },
      {
        artistId: artist.id,
        promoter: "Club Space",
        venue: "Club Space Miami",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        fee: 2000,
        status: "confirmed",
      },
      {
        artistId: artist.id,
        promoter: "E11EVEN",
        venue: "E11EVEN Miami",
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        fee: 1800,
        status: "inquiry",
        notes: "New Year's Eve event inquiry",
      },
      {
        artistId: artist.id,
        promoter: "STORY Nightclub",
        venue: "STORY Miami Beach",
        eventDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        fee: 1500,
        status: "completed",
      },
    ],
  })

  // Seed invoices
  await prisma.invoice.createMany({
    skipDuplicates: true,
    data: [
      {
        artistId: artist.id,
        client: "LIV Miami",
        amount: 2500,
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        artistId: artist.id,
        client: "STORY Miami Beach",
        amount: 1500,
        status: "paid",
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        artistId: artist.id,
        client: "Private Event — Brickell",
        amount: 800,
        status: "overdue",
        dueDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        remindersSent: 1,
      },
    ],
  })

  // Seed content items
  const contentData = [
    {
      platform: "instagram",
      caption: "Back at LIV next Friday. If you know, you know. 🔊",
      hook: "Back at LIV next Friday.",
      hashtags: "#miami #housemusic #livmiami",
      mediaType: "post",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      platform: "tiktok",
      caption: "The transition at 47 minutes that made the whole room stop. Playing this one out every set right now.",
      hook: "The transition at 47 minutes.",
      hashtags: "#djset #techhouse #miami",
      mediaType: "reel",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      platform: "both",
      caption: "Miami at 3am sounds like this. New mix dropping this week — link in bio.",
      hook: "Miami at 3am sounds like this.",
      hashtags: "#miami #deephouse #djmix",
      mediaType: "reel",
      status: "draft",
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const item of contentData) {
    await prisma.contentItem.create({
      data: { artistId: artist.id, source: "agent", ...item },
    })
  }

  // Seed agent logs
  await prisma.agentLog.createMany({
    data: [
      {
        artistId: artist.id,
        agentType: "booking",
        action: "Processed booking inquiry",
        details: "From: events@livmiami.com | Auto-response drafted",
        status: "success",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        artistId: artist.id,
        agentType: "content",
        action: "Generated 7 content posts",
        details: "Weekly batch for DJ Fernandez",
        status: "success",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        artistId: artist.id,
        agentType: "revenue",
        action: "Sent payment reminder",
        details: "Invoice to Private Event — Brickell - $800 - 21 days overdue",
        status: "success",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        artistId: artist.id,
        agentType: "intel",
        action: "Generated weekly brief",
        details: `Week of ${new Date().toLocaleDateString()}`,
        status: "success",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ],
  })

  console.log("✅ Seed complete — demo@roster.app / any password")
}

main().catch(console.error).finally(() => prisma.$disconnect())
