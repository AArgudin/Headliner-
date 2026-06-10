"use client"
import { useEffect, useState } from "react"

type Artist = {
  id: string
  name: string
  genre: string
  bio?: string
  email?: string
  instagram?: string
  tiktok?: string
  soundcloud?: string
  spotify?: string
  bookingFee: number
  city: string
}

export default function SettingsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selected, setSelected] = useState<Artist | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/artists").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
      if (d.artists?.length > 0) setSelected(d.artists[0])
    })
  }, [])

  function update(field: string, value: string | number) {
    if (!selected) return
    setSelected(prev => prev ? { ...prev, [field]: value } : null)
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    await fetch("/api/artists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!selected) return (
    <div className="p-8 text-center text-zinc-600 text-sm pt-32">
      <div className="text-4xl mb-4">⚙️</div>
      No artist profile found. Create one from the dashboard.
    </div>
  )

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Artist profile — used by all five agents</p>
      </div>

      {artists.length > 1 && (
        <select value={selected.id} onChange={e => setSelected(artists.find(a => a.id === e.target.value) || null)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none mb-6">
          {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
        <div className="pb-4 border-b border-zinc-800">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Artist profile</div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "name", label: "Artist name", placeholder: "DJ Fernandez" },
              { key: "genre", label: "Genre", placeholder: "Electronic / House" },
              { key: "city", label: "City", placeholder: "Miami, FL" },
              { key: "email", label: "Booking email", placeholder: "booking@artist.com" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-zinc-500 mb-1.5">{f.label}</label>
                <input value={(selected as any)[f.key] || ""} onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500" />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-xs text-zinc-500 mb-1.5">Bio (used in PR pitches)</label>
            <textarea value={selected.bio || ""} onChange={e => update("bio", e.target.value)}
              placeholder="Short artist bio for press and promoter outreach..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500 resize-none" />
          </div>
          <div className="mt-4">
            <label className="block text-xs text-zinc-500 mb-1.5">Standard booking fee ($)</label>
            <input type="number" value={selected.bookingFee} onChange={e => update("bookingFee", parseFloat(e.target.value))}
              className="w-40 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500" />
          </div>
        </div>

        <div>
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Social links</div>
          <div className="space-y-3">
            {[
              { key: "instagram", label: "Instagram handle", placeholder: "@djfernandez" },
              { key: "tiktok", label: "TikTok handle", placeholder: "@djfernandez" },
              { key: "soundcloud", label: "SoundCloud URL", placeholder: "soundcloud.com/djfernandez" },
              { key: "spotify", label: "Spotify artist URL", placeholder: "open.spotify.com/artist/..." },
            ].map(f => (
              <div key={f.key} className="flex items-center gap-4">
                <label className="text-xs text-zinc-500 w-36 flex-shrink-0">{f.label}</label>
                <input value={(selected as any)[f.key] || ""} onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={save} disabled={saving}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved ✓</span>}
      </div>

      {/* Agent info */}
      <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">How your agents use this</div>
        <div className="space-y-3">
          {[
            { agent: "Booking Agent", uses: "Name, fee, city — for responding to inquiries and generating contracts" },
            { agent: "Content Agent", uses: "Name, genre, city, social links — for writing in your voice" },
            { agent: "Revenue Agent", uses: "Email — for invoice and reminder context" },
            { agent: "PR Agent", uses: "Name, genre, bio, city — for personalized pitch emails" },
            { agent: "Intel Agent", uses: "Everything — synthesized into your weekly brief" },
          ].map(item => (
            <div key={item.agent} className="flex items-start gap-3">
              <span className="text-xs font-mono text-sky-400 w-32 flex-shrink-0">{item.agent}</span>
              <span className="text-xs text-zinc-500 leading-relaxed">{item.uses}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
