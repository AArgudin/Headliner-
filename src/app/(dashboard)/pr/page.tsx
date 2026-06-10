"use client"
import { useEffect, useState } from "react"

type PrCampaign = {
  id: string
  release: string
  type: string
  status: string
  sentCount: number
  responseCount: number
  createdAt: string
  targets?: PrTarget[]
}

type PrTarget = {
  id: string
  name: string
  type: string
  email?: string
  pitchSent: boolean
  sentAt?: string
  responded: boolean
}

type Artist = { id: string; name: string }

export default function PrPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtistId, setSelectedArtistId] = useState("")
  const [campaigns, setCampaigns] = useState<PrCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<PrCampaign | null>(null)
  const [targets, setTargets] = useState<PrTarget[]>([])
  const [newRelease, setNewRelease] = useState("")
  const [newType, setNewType] = useState("single")
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [pitchLoading, setPitchLoading] = useState<string | null>(null)
  const [pitchText, setPitchText] = useState<Record<string, string>>({})
  const [addingCampaign, setAddingCampaign] = useState(false)

  useEffect(() => {
    fetch("/api/artists").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
      if (d.artists?.length > 0) setSelectedArtistId(d.artists[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedArtistId) return
    fetch(`/api/pr?artistId=${selectedArtistId}`)
      .then(r => r.json()).then(d => setCampaigns(d.campaigns || []))
  }, [selectedArtistId])

  useEffect(() => {
    if (!selectedCampaign) return
    fetch(`/api/pr/targets?campaignId=${selectedCampaign.id}`)
      .then(r => r.json()).then(d => setTargets(d.targets || []))
  }, [selectedCampaign])

  async function createCampaign() {
    if (!newRelease.trim() || !selectedArtistId) return
    setCreatingCampaign(true)
    const res = await fetch("/api/agents/pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_campaign", artistId: selectedArtistId, release: newRelease, type: newType }),
    })
    const { campaign } = await res.json()
    setCampaigns(prev => [campaign, ...prev])
    setSelectedCampaign(campaign)
    setNewRelease("")
    setAddingCampaign(false)
    setCreatingCampaign(false)
  }

  async function generatePitch(targetId: string) {
    if (!selectedCampaign || !selectedArtistId) return
    setPitchLoading(targetId)
    const res = await fetch("/api/agents/pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_pitch",
        artistId: selectedArtistId,
        targetId,
        campaignId: selectedCampaign.id,
      }),
    })
    const { pitch } = await res.json()
    setPitchText(prev => ({ ...prev, [targetId]: pitch }))
    setTargets(prev => prev.map(t => t.id === targetId ? { ...t, pitchSent: true, sentAt: new Date().toISOString() } : t))
    setPitchLoading(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">PR</h1>
          <p className="text-zinc-500 text-sm mt-0.5">PR Agent — pitch blogs, curators, and press</p>
        </div>
        <div className="flex gap-3">
          {artists.length > 1 && (
            <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none">
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button onClick={() => setAddingCampaign(!addingCampaign)}
            className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New campaign
          </button>
        </div>
      </div>

      {addingCampaign && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">New PR campaign</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1.5">Release name</label>
              <input value={newRelease} onChange={e => setNewRelease(e.target.value)}
                placeholder="Track name, EP title..."
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500" />
            </div>
            <div className="w-36">
              <label className="block text-xs text-zinc-500 mb-1.5">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none">
                {["single", "ep", "album", "event"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createCampaign} disabled={creatingCampaign}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg">
              {creatingCampaign ? "Creating..." : "Create campaign"}
            </button>
            <button onClick={() => setAddingCampaign(false)} className="text-zinc-500 text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Campaigns list */}
        <div className="col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Campaigns</span>
            </div>
            {campaigns.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm px-4">
                <div className="text-3xl mb-2">📣</div>
                Create a campaign to start pitching
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {campaigns.map(c => (
                  <button key={c.id}
                    onClick={() => setSelectedCampaign(c)}
                    className={`w-full text-left px-4 py-4 hover:bg-zinc-800/50 transition-colors ${selectedCampaign?.id === c.id ? "bg-zinc-800" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-zinc-200">{c.release}</div>
                        <div className="text-xs text-zinc-600 mt-0.5 capitalize">{c.type}</div>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                        c.status === "active" ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                      }`}>{c.status}</span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-zinc-600">{c.sentCount} sent</span>
                      <span className="text-xs text-zinc-600">{c.responseCount} responses</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Targets */}
        <div className="col-span-2">
          {selectedCampaign ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <div className="text-sm font-semibold text-zinc-300">{selectedCampaign.release} — outreach targets</div>
                <div className="text-xs text-zinc-600 mt-0.5">Generate personalised pitches for each outlet</div>
              </div>
              {targets.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 text-sm">Loading targets...</div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {targets.map(target => (
                    <div key={target.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-sm font-medium text-zinc-300">{target.name}</div>
                            <div className="text-xs text-zinc-600 capitalize">{target.type} · {target.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {target.pitchSent ? (
                            <span className="text-xs font-mono px-2 py-1 rounded bg-sky-950 border border-sky-800 text-sky-400">
                              Sent {target.sentAt ? new Date(target.sentAt).toLocaleDateString() : ""}
                            </span>
                          ) : (
                            <button onClick={() => generatePitch(target.id)}
                              disabled={pitchLoading === target.id}
                              className="text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-colors">
                              {pitchLoading === target.id ? "Writing..." : "Generate pitch"}
                            </button>
                          )}
                        </div>
                      </div>
                      {pitchText[target.id] && (
                        <div className="mt-3 bg-zinc-800 rounded-xl p-4">
                          <div className="text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-widest">Generated pitch email</div>
                          <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{pitchText[target.id]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center h-64 text-zinc-600 text-sm">
              Select a campaign to manage outreach
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
