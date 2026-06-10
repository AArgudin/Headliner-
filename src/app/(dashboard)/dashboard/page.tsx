"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type AgentLog = {
  id: string
  agentType: string
  action: string
  details?: string
  status: string
  createdAt: string
}

type Artist = {
  id: string
  name: string
  genre: string
  city: string
  _count: { bookings: number; contentItems: number; invoices: number }
}

const AGENT_COLORS: Record<string, string> = {
  booking: "text-violet-400 bg-violet-950",
  content: "text-sky-400 bg-sky-950",
  revenue: "text-emerald-400 bg-emerald-950",
  pr: "text-amber-400 bg-amber-950",
  intel: "text-pink-400 bg-pink-950",
}

const AGENT_ICONS: Record<string, string> = {
  booking: "📅", content: "📱", revenue: "💰", pr: "📣", intel: "🧠"
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [brief, setBrief] = useState<string | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [newArtistName, setNewArtistName] = useState("")
  const [creatingArtist, setCreatingArtist] = useState(false)

  useEffect(() => {
    fetch("/api/artists").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
      if (d.artists?.length > 0) setSelectedArtist(d.artists[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedArtist) return
    fetch(`/api/logs?artistId=${selectedArtist.id}`)
      .then(r => r.json()).then(d => setLogs(d.logs || []))
  }, [selectedArtist])

  async function createArtist() {
    if (!newArtistName.trim()) return
    setCreatingArtist(true)
    const res = await fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newArtistName, genre: "Electronic / House", city: "Miami, FL" }),
    })
    const { artist } = await res.json()
    const updated = [...artists, { ...artist, _count: { bookings: 0, contentItems: 0, invoices: 0 } }]
    setArtists(updated)
    setSelectedArtist(updated[updated.length - 1])
    setNewArtistName("")
    setCreatingArtist(false)
  }

  async function generateBrief() {
    if (!selectedArtist) return
    setBriefLoading(true)
    const res = await fetch("/api/agents/intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId: selectedArtist.id }),
    })
    const data = await res.json()
    setBrief(data.brief)
    setBriefLoading(false)
    // Refresh logs
    fetch(`/api/logs?artistId=${selectedArtist.id}`)
      .then(r => r.json()).then(d => setLogs(d.logs || []))
  }

  async function runContentAgent() {
    if (!selectedArtist) return
    await fetch("/api/agents/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_batch", artistId: selectedArtist.id }),
    })
    fetch(`/api/logs?artistId=${selectedArtist.id}`)
      .then(r => r.json()).then(d => setLogs(d.logs || []))
  }

  async function runRevenueAgent() {
    if (!selectedArtist) return
    await fetch("/api/agents/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check_overdue", artistId: selectedArtist.id }),
    })
    fetch(`/api/logs?artistId=${selectedArtist.id}`)
      .then(r => r.json()).then(d => setLogs(d.logs || []))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {selectedArtist ? `${selectedArtist.name}'s Dashboard` : "Dashboard"}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Artist selector */}
        <div className="flex items-center gap-3">
          {artists.length > 0 && (
            <select
              value={selectedArtist?.id || ""}
              onChange={e => setSelectedArtist(artists.find(a => a.id === e.target.value) || null)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
            >
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* No artists state */}
      {artists.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">🎧</div>
          <h2 className="text-xl font-semibold text-white mb-2">Add your first artist</h2>
          <p className="text-zinc-500 text-sm mb-6">Create an artist profile to activate your agents</p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input
              value={newArtistName}
              onChange={e => setNewArtistName(e.target.value)}
              placeholder="Artist name..."
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
              onKeyDown={e => e.key === "Enter" && createArtist()}
            />
            <button
              onClick={createArtist}
              disabled={creatingArtist}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              {creatingArtist ? "..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {selectedArtist && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Bookings", value: selectedArtist._count.bookings, icon: "📅", color: "text-violet-400" },
              { label: "Scheduled posts", value: selectedArtist._count.contentItems, icon: "📱", color: "text-sky-400" },
              { label: "Invoices", value: selectedArtist._count.invoices, icon: "💰", color: "text-emerald-400" },
              { label: "Agent actions", value: logs.length, icon: "⚡", color: "text-amber-400" },
            ].map(stat => (
              <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                  <span>{stat.icon}</span>
                </div>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Agents + Quick actions */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Quick actions */}
            <div className="col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4 font-mono uppercase tracking-widest">Run agents</h2>
              <div className="space-y-3">
                <button
                  onClick={generateBrief}
                  disabled={briefLoading}
                  className="w-full flex items-center gap-3 bg-pink-950 hover:bg-pink-900 border border-pink-800 text-pink-300 text-sm font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  <span>🧠</span>
                  {briefLoading ? "Generating brief..." : "Generate weekly brief"}
                </button>
                <button
                  onClick={runContentAgent}
                  className="w-full flex items-center gap-3 bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                >
                  <span>📱</span>
                  Generate 7 posts
                </button>
                <button
                  onClick={runRevenueAgent}
                  className="w-full flex items-center gap-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-sm font-medium px-4 py-3 rounded-xl transition-colors"
                >
                  <span>💰</span>
                  Check overdue invoices
                </button>
              </div>
            </div>

            {/* Weekly brief */}
            <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-4 font-mono uppercase tracking-widest">Weekly brief</h2>
              {brief ? (
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans max-h-52 overflow-y-auto">{brief}</pre>
              ) : (
                <div className="flex items-center justify-center h-40 text-center">
                  <div>
                    <div className="text-3xl mb-3">🧠</div>
                    <p className="text-zinc-500 text-sm">Run the Intel Agent to generate your weekly brief</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Agent activity feed */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4 font-mono uppercase tracking-widest">Agent activity feed</h2>
            {logs.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No agent activity yet. Run an agent to see logs.</p>
            ) : (
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-zinc-800 last:border-0">
                    <span className={`text-xs font-mono px-2 py-1 rounded-md flex-shrink-0 ${AGENT_COLORS[log.agentType] || "text-zinc-400 bg-zinc-800"}`}>
                      {AGENT_ICONS[log.agentType]} {log.agentType}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-300">{log.action}</div>
                      {log.details && <div className="text-xs text-zinc-600 mt-0.5 truncate">{log.details}</div>}
                    </div>
                    <span className="text-xs text-zinc-600 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
