export interface Artist {
  id: string
  userId: string
  name: string
  genre: string
  bio?: string | null
  email?: string | null
  instagram?: string | null
  tiktok?: string | null
  soundcloud?: string | null
  spotify?: string | null
  bookingFee: number
  city: string
  createdAt: Date
}

export interface Booking {
  id: string
  artistId: string
  promoter: string
  venue: string
  eventDate: Date
  fee: number
  status: "inquiry" | "confirmed" | "completed" | "cancelled"
  notes?: string | null
  contractUrl?: string | null
  paidAt?: Date | null
  createdAt: Date
}

export interface ContentItem {
  id: string
  artistId: string
  platform: "instagram" | "tiktok" | "both"
  caption: string
  hook?: string | null
  hashtags?: string | null
  mediaType: "post" | "reel" | "story"
  status: "draft" | "scheduled" | "posted" | "rejected"
  scheduledAt?: Date | null
  postedAt?: Date | null
  source: "agent" | "manual"
  createdAt: Date
}

export interface Invoice {
  id: string
  artistId: string
  bookingId?: string | null
  client: string
  amount: number
  status: "pending" | "sent" | "paid" | "overdue"
  dueDate: Date
  sentAt?: Date | null
  paidAt?: Date | null
  remindersSent: number
  notes?: string | null
  createdAt: Date
}

export interface AgentLog {
  id: string
  artistId: string
  agentType: "booking" | "content" | "revenue" | "pr" | "intel"
  action: string
  details?: string | null
  status: "success" | "pending" | "error"
  createdAt: Date
}
