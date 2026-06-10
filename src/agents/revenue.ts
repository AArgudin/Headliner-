import { runAgent } from "@/lib/anthropic"
import { prisma } from "@/lib/prisma"
import { addDays, isPast, differenceInDays } from "date-fns"

export async function checkOverdueInvoices(artistId: string) {
  const overdue = await prisma.invoice.findMany({
    where: {
      artistId,
      status: { in: ["pending", "sent"] },
      dueDate: { lt: new Date() },
    },
  })

  const actions = []

  for (const invoice of overdue) {
    const daysPast = differenceInDays(new Date(), invoice.dueDate)
    
    if (invoice.remindersSent < 3) {
      // Generate reminder
      const reminder = await generatePaymentReminder(invoice, daysPast)
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { 
          status: "overdue",
          remindersSent: { increment: 1 }
        },
      })

      await prisma.agentLog.create({
        data: {
          artistId,
          agentType: "revenue",
          action: "Sent payment reminder",
          details: `Invoice to ${invoice.client} - $${invoice.amount} - ${daysPast} days overdue`,
          status: "success",
        },
      })

      actions.push({ invoice, reminder, daysPast })
    }
  }

  return actions
}

async function generatePaymentReminder(invoice: any, daysPast: number) {
  const system = `You write professional but firm payment reminder emails for a DJ artist management platform.
Tone: professional, direct, no-nonsense. Not aggressive but clear about expectations.
Keep it under 100 words. No fluff.`

  return runAgent(
    system,
    `Write a payment reminder email:
Client: ${invoice.client}
Amount owed: $${invoice.amount}
Days overdue: ${daysPast}
Reminder number: ${invoice.remindersSent + 1} of 3
${daysPast > 14 ? "This is a serious overdue situation. Mention potential escalation." : "Polite but clear first reminder."}`,
    300
  )
}

export async function getRevenueStats(artistId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [monthly, yearly, pending, overdue, bookingRevenue] = await Promise.all([
    prisma.invoice.aggregate({
      where: { artistId, status: "paid", paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { artistId, status: "paid", paidAt: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { artistId, status: { in: ["pending", "sent"] } },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { artistId, status: "overdue" },
      _sum: { amount: true },
    }),
    prisma.booking.aggregate({
      where: { artistId, status: "completed" },
      _sum: { fee: true },
    }),
  ])

  // Build monthly revenue for chart (last 6 months)
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    
    const rev = await prisma.invoice.aggregate({
      where: { artistId, status: "paid", paidAt: { gte: start, lte: end } },
      _sum: { amount: true },
    })
    
    monthlyData.push({
      month: d.toLocaleString("default", { month: "short" }),
      revenue: rev._sum.amount || 0,
    })
  }

  return {
    monthly: monthly._sum.amount || 0,
    yearly: yearly._sum.amount || 0,
    pending: pending._sum.amount || 0,
    overdue: overdue._sum.amount || 0,
    bookingRevenue: bookingRevenue._sum.fee || 0,
    monthlyData,
  }
}

export async function createInvoice(
  artistId: string,
  data: { client: string; amount: number; bookingId?: string; notes?: string }
) {
  const dueDate = addDays(new Date(), 14)

  return prisma.invoice.create({
    data: {
      artistId,
      client: data.client,
      amount: data.amount,
      bookingId: data.bookingId,
      notes: data.notes,
      status: "pending",
      dueDate,
    },
  })
}
