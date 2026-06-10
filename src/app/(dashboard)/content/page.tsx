"use client"
import { useEffect, useState } from "react"

type ContentItem = {
  id: string
  platform: string
  caption: string
  hook?: string
  hashtags?: string
  mediaType: string
  status: string
  scheduledAt?: string
  source: string
}

type Artist = { id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  draft: "text-zinc-400 bg-zinc-800 border-zinc-700",
  scheduled: "text-sky-400 bg-sky-950 border-sky-800",
  posted: "text-emerald-400 bg-emerald-950 border-emerald-800",
  rejected: "text-red-400 bg-red-950 border-red-800",
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  both: "📱",
}

export default function ContentPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtistId, setSelectedArtistId] = useState("")
  const [items, setItems] = useState<ContentItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [singleContext, setSingleContext] = useState("")
  const [singleLoading, setSingleLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/artists").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
      if (d.artists?.length > 0) setSelectedArtistId(d.artists[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedArtistId) return
    fetch(`/api/content?artistId=${selectedArtistId}`)
      .then(r => r.json()).then(d => setItems(d.items || []))
  }, [selectedArtistId])

  async function generateBatch() {
    if (!selectedArtistId) return
    setGenerating(true)
    const res = await fetch("/api/agents/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_batch", artistId: selectedArtistId, count: 7 }),
    })
    const data = await res.json()
    if (data.posts) setItems(prev => [...data.posts, ...prev])
    setGenerating(false)
  }

  async function generateSingle() {
    if (!singleContext.trim() || !selectedArtistId) return
    setSingleLoading(true)
    const res = await fetch("/api/agents/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_single", artistId: selectedArtistId, context: singleContext }),
    })
    const data = await res.json()
    if (data.post) {
      // Save it
      const saved = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "new", ...data.post, artistId: selectedArtistId, status: "draft" }),
      })
      // Refresh
      fetch(`/api/content?artistId=${selectedArtistId}`)
        .then(r => r.json()).then(d => setItems(d.items || []))
    }
    setSingleContext("")
    setSingleLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  async function deleteItem(id: string) {
    await fetch("/api/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const scheduled = items.filter(i => i.status === "scheduled")
  const drafts = items.filter(i => i.status === "draft")
  const posted = items.filter(i => i.status === "posted")

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Content</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Content Agent — write, schedule, and manage posts</p>
        </div>
        <div className="flex gap-3">
          {artists.length > 1 && (
            <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none">
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button onClick={generateBatch} disabled={generating}
            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {generating ? "Agent working..." : "⚡ Generate 7 posts"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Scheduled", value: scheduled.length, color: "text-sky-400" },
          { label: "Drafts", value: drafts.length, color: "text-amber-400" },
          { label: "Posted", value: posted.length, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Single post generator */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono px-2 py-1 rounded-md bg-sky-950 text-sky-400">Content Agent</span>
          <span className="text-xs text-zinc-600">Generate a specific post</span>
        </div>
        <div className="flex gap-3">
          <input value={singleContext} onChange={e => setSingleContext(e.target.value)}
            placeholder="Context: playing at LIV Miami on Saturday, progressive house set..."
            className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-sky-500"
            onKeyDown={e => e.key === "Enter" && generateSingle()} />
          <button onClick={generateSingle} disabled={singleLoading}
            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            {singleLoading ? "Writing..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Content feed */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Content queue</h2>
        </div>
        {items.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">
            <div className="text-4xl mb-3">📱</div>
            Run the Content Agent to generate your first posts
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {items.map(item => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="text-xl flex-shrink-0 mt-0.5">{PLATFORM_ICONS[item.platform] || "📱"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                      <span className="text-xs text-zinc-600">{item.platform}</span>
                      {item.scheduledAt && (
                        <span className="text-xs text-zinc-600">
                          {new Date(item.scheduledAt).toLocaleDateString()} at {new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    {item.hook && (
                      <div className="text-sm font-medium text-zinc-200 mb-1">{item.hook}</div>
                    )}
                    <p className={`text-sm text-zinc-400 leading-relaxed ${expandedId === item.id ? "" : "line-clamp-2"}`}>
                      {item.caption}
                    </p>
                    {item.caption.length > 120 && (
                      <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        className="text-xs text-sky-500 hover:text-sky-400 mt-1">
                        {expandedId === item.id ? "Show less" : "Show more"}
                      </button>
                    )}
                    {item.hashtags && (
                      <div className="text-xs text-sky-600 mt-1">{item.hashtags}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select value={item.status} onChange={e => updateStatus(item.id, e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-lg px-2 py-1 focus:outline-none">
                      {["draft", "scheduled", "posted", "rejected"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-zinc-700 hover:text-red-500 transition-colors text-sm">×</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
