import { runAgent } from "@/lib/anthropic"
import { prisma } from "@/lib/prisma"

const PR_TARGETS_TEMPLATES = [
  { name: "Resident Advisor", type: "blog", email: "editorial@ra.co" },
  { name: "Mixmag", type: "press", email: "news@mixmag.net" },
  { name: "DJ Mag", type: "press", email: "news@djmag.com" },
  { name: "Traxsource Blog", type: "blog", email: "blog@traxsource.com" },
  { name: "Magnetic Magazine", type: "blog", email: "submissions@magneticmag.com" },
  { name: "Data Transmission", type: "blog", email: "promos@datatransmission.co" },
  { name: "Electronic Groove", type: "blog", email: "promo@electronicgroove.com" },
]

export async function createPrCampaign(
  artistId: string,
  release: string,
  type: string = "single"
) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  if (!artist) throw new Error("Artist not found")

  const campaign = await prisma.prCampaign.create({
    data: {
      artistId,
      release,
      type,
      outreachList: JSON.stringify(PR_TARGETS_TEMPLATES),
      status: "active",
    },
  })

  // Create individual targets
  await prisma.prTarget.createMany({
    data: PR_TARGETS_TEMPLATES.map((t) => ({
      campaignId: campaign.id,
      name: t.name,
      type: t.type,
      email: t.email,
    })),
  })

  await prisma.agentLog.create({
    data: {
      artistId,
      agentType: "pr",
      action: "Created PR campaign",
      details: `Release: ${release} | Targets: ${PR_TARGETS_TEMPLATES.length}`,
      status: "success",
    },
  })

  return campaign
}

export async function generatePitchEmail(
  artistId: string,
  targetId: string,
  campaignId: string
) {
  const [artist, target, campaign] = await Promise.all([
    prisma.artist.findUnique({ where: { id: artistId } }),
    prisma.prTarget.findUnique({ where: { id: targetId } }),
    prisma.prCampaign.findUnique({ where: { id: campaignId } }),
  ])
  if (!artist || !target || !campaign) throw new Error("Not found")

  const system = `You write music PR pitch emails for electronic music artists.
Keep pitches short (under 120 words), specific, and professional.
Never use "I hope this email finds you well." Start strong with the hook.
Sound like a real PR person who knows the publication, not a template.`

  const pitch = await runAgent(
    system,
    `Write a pitch email to ${target.name} (${target.type}) for:
Artist: ${artist.name}
Genre: ${artist.genre}
Based in: ${artist.city}
Release: ${campaign.release} (${campaign.type})
${artist.bio ? `Bio context: ${artist.bio}` : ""}
The pitch should feel personal to this specific outlet.`,
    400
  )

  // Mark as sent
  await prisma.prTarget.update({
    where: { id: targetId },
    data: { pitchSent: true, sentAt: new Date() },
  })

  await prisma.prCampaign.update({
    where: { id: campaignId },
    data: { sentCount: { increment: 1 } },
  })

  await prisma.agentLog.create({
    data: {
      artistId,
      agentType: "pr",
      action: `Pitched ${target.name}`,
      details: `Campaign: ${campaign.release}`,
      status: "success",
    },
  })

  return pitch
}
