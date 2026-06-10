"use client"
import { useEffect, useState } from "react"

type Booking = {
  id: string
  promoter: string
  venue: string
  eventDate: string
  fee: number
  status: string
  notes?: string
}

type Artist = { id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  inquiry: "text-amber-400 bg-amber-950 border-amber-800",
  confirmed: "text-sky-400 bg-sky-950 border-sky-800",
  completed: "text-emerald-400 bg-emerald-950 border-emerald-800",
  cancelled: "text-red-400 bg-red-950 border-red-800",
}

export default function BookingsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtistId, setSelectedArtistId] = useState("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [inquiry, setInquiry] = useState("")
  const [promoterEmail, setPromoterEmail] = useState("")
  const [agentResponse, setAgentResponse] = useState("")
  const [agentLoading, setAgentLoading] = useState(false)
  const [contractText, setContractText] = useState("")
  const [contractLoading, setContractLoading] = useState(false)
  const [addingBooking, setAddingBooking] = useState(false)
  const [newBooking, setNewBooking] = useState({ promoter: "", venue: "", eventDate: "", fee: "" })

  useEffect(() => {
    fetch("/api/artists").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
      if (d.artists?.length > 0) setSelectedArtistId(d.artists[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedArtistId) return
    fetch(`/api/bookings?artistId=${selectedArtistId}`)
      .then(r => r.json()).then(d => setBookings(d.bookings || []))
  }, [selectedArtistId])

  async function processInquiry() {
    if (!inquiry.trim() || !selectedArtistId) return
    setAgentLoading(true)
    const res = await fetch("/api/agents/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process_inquiry", artistId: selectedArtistId, inquiry, promoterEmail }),
    })
    const data = await res.json()
    setAgentResponse(data.response || data.error)
    setAgentLoading(false)
  }

  async function genContract(bookingId: string) {
    setContractLoading(true)
    const res = await fetch("/api/agents/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_contract", artistId: selectedArtistId, bookingId }),
    })
    const data = await res.json()
    setContractText(data.contract || data.error)
    setContractLoading(false)
  }

  async function addBooking() {
    if (!newBooking.venue || !newBooking.eventDate) return
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artistId: selectedArtistId,
        ...newBooking,
        fee: parseFloat(newBooking.fee) || 0,
        eventDate: new Date(newBooking.eventDate).toISOString(),
      }),
    })
    const { booking } = await res.json()
    setBookings(prev => [booking, ...prev])
    setNewBooking({ promoter: "", venue: "", eventDate: "", fee: "" })
    setAddingBooking(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Booking agent — inquiries, contracts, calendar</p>
        </div>
        <div className="flex gap-3">
          {artists.length > 1 && (
            <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none">
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button onClick={() => setAddingBooking(!addingBooking)}
            className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Add booking
          </button>
        </div>
      </div>

      {addingBooking && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">New booking</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { key: "promoter", label: "Promoter / Client", placeholder: "Club XS Miami" },
              { key: "venue", label: "Venue", placeholder: "LIV Miami" },
              { key: "eventDate", label: "Event date", type: "datetime-local" },
              { key: "fee", label: "Fee ($)", placeholder: "1500", type: "number" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-zinc-500 mb-1.5">{f.label}</label>
                <input type={f.type || "text"} placeholder={f.placeholder}
                  value={(newBooking as any)[f.key]}
                  onChange={e => setNewBooking(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={addBooking} className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors">Save</button>
            <button onClick={() => setAddingBooking(false)} className="text-zinc-500 hover:text-zinc-300 text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Inquiry processor */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-violet-950 text-violet-400">Booking Agent</span>
            <span className="text-xs text-zinc-600">Process inquiry</span>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Promoter email</label>
              <input value={promoterEmail} onChange={e => setPromoterEmail(e.target.value)}
                placeholder="promoter@club.com"
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Inquiry message</label>
              <textarea value={inquiry} onChange={e => setInquiry(e.target.value)}
                placeholder="Hi, we'd like to book your artist for New Year's Eve..."
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500 resize-none" />
            </div>
          </div>
          <button onClick={processInquiry} disabled={agentLoading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            {agentLoading ? "Agent working..." : "Process with Booking Agent"}
          </button>
          {agentResponse && (
            <div className="mt-4 bg-zinc-800 rounded-xl p-4">
              <div className="text-xs text-zinc-500 mb-2 font-mono">Agent response draft</div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{agentResponse}</p>
            </div>
          )}
        </div>

        {/* Contract generator */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-mono px-2 py-1 rounded-md bg-violet-950 text-violet-400">Booking Agent</span>
            <span className="text-xs text-zinc-600">Generate contract</span>
          </div>
          {bookings.filter(b => b.status === "confirmed").length > 0 ? (
            <div className="space-y-2 mb-4">
              {bookings.filter(b => b.status === "confirmed").map(b => (
                <div key={b.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                  <div>
                    <div className="text-sm text-zinc-300 font-medium">{b.venue}</div>
                    <div className="text-xs text-zinc-600">{new Date(b.eventDate).toLocaleDateString()} · ${b.fee}</div>
                  </div>
                  <button onClick={() => genContract(b.id)} disabled={contractLoading}
                    className="text-xs bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Generate
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm mb-4">No confirmed bookings. Confirm a booking below to generate a contract.</p>
          )}
          {contractText && (
            <div className="bg-zinc-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              <div className="text-xs text-zinc-500 mb-2 font-mono">Generated contract</div>
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{contractText}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Bookings table */}
      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">All bookings</h2>
        </div>
        {bookings.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">No bookings yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Venue", "Promoter", "Date", "Fee", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-mono text-zinc-500 uppercase tracking-widest px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-300 font-medium">{b.venue}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{b.promoter}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{new Date(b.eventDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300 font-mono">${b.fee.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded border ${STATUS_STYLES[b.status] || "text-zinc-400 bg-zinc-800 border-zinc-700"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-lg px-2 py-1 focus:outline-none">
                      {["inquiry", "confirmed", "completed", "cancelled"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
