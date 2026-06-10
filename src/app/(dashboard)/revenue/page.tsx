"use client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

type Invoice = {
  id: string
  client: string
  amount: number
  status: string
  dueDate: string
  paidAt?: string
  notes?: string
  remindersSent: number
}

type Artist = { id: string; name: string }

const STATUS_STYLES: Record<string, string> = {
  pending: "text-amber-400 bg-amber-950 border-amber-800",
  sent: "text-sky-400 bg-sky-950 border-sky-800",
  paid: "text-emerald-400 bg-emerald-950 border-emerald-800",
  overdue: "text-red-400 bg-red-950 border-red-800",
}

export default function RevenuePage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [selectedArtistId, setSelectedArtistId] = useState("")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [newInvoice, setNewInvoice] = useState({ client: "", amount: "" })
  const [addingInvoice, setAddingInvoice] = useState(false)

  useEffect(() => {
    fetch("/api/artists").then(r => r.json()).then(d => {
      setArtists(d.artists || [])
      if (d.artists?.length > 0) setSelectedArtistId(d.artists[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedArtistId) return
    fetch(`/api/invoices?artistId=${selectedArtistId}`)
      .then(r => r.json()).then(d => setInvoices(d.invoices || []))
    fetch("/api/agents/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_stats", artistId: selectedArtistId }),
    }).then(r => r.json()).then(d => setStats(d.stats))
  }, [selectedArtistId])

  async function checkOverdue() {
    if (!selectedArtistId) return
    setChecking(true)
    await fetch("/api/agents/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check_overdue", artistId: selectedArtistId }),
    })
    // Refresh invoices
    fetch(`/api/invoices?artistId=${selectedArtistId}`)
      .then(r => r.json()).then(d => setInvoices(d.invoices || []))
    setChecking(false)
  }

  async function addInvoice() {
    if (!newInvoice.client || !newInvoice.amount) return
    const res = await fetch("/api/agents/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_invoice",
        artistId: selectedArtistId,
        client: newInvoice.client,
        amount: parseFloat(newInvoice.amount),
      }),
    })
    const { invoice } = await res.json()
    setInvoices(prev => [invoice, ...prev])
    setNewInvoice({ client: "", amount: "" })
    setAddingInvoice(false)
    // Refresh stats
    fetch("/api/agents/revenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_stats", artistId: selectedArtistId }),
    }).then(r => r.json()).then(d => setStats(d.stats))
  }

  async function markPaid(id: string) {
    await fetch("/api/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "paid", paidAt: new Date().toISOString() }),
    })
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid", paidAt: new Date().toISOString() } : i))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Revenue Agent — invoices, tracking, overdue reminders</p>
        </div>
        <div className="flex gap-3">
          {artists.length > 1 && (
            <select value={selectedArtistId} onChange={e => setSelectedArtistId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none">
              {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <button onClick={checkOverdue} disabled={checking}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {checking ? "Checking..." : "⚡ Check overdue"}
          </button>
          <button onClick={() => setAddingInvoice(!addingInvoice)}
            className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + New invoice
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "This month", value: `$${stats.monthly.toLocaleString()}`, color: "text-emerald-400" },
            { label: "This year", value: `$${stats.yearly.toLocaleString()}`, color: "text-sky-400" },
            { label: "Pending", value: `$${stats.pending.toLocaleString()}`, color: "text-amber-400" },
            { label: "Overdue", value: `$${stats.overdue.toLocaleString()}`, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">{s.label}</div>
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {stats?.monthlyData && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 font-mono uppercase tracking-widest">Revenue — last 6 months</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.monthlyData} barSize={28}>
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {stats.monthlyData.map((_: any, i: number) => (
                  <Cell key={i} fill={i === stats.monthlyData.length - 1 ? "#10b981" : "#27272a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add invoice */}
      {addingInvoice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">New invoice</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-zinc-500 mb-1.5">Client</label>
              <input value={newInvoice.client} onChange={e => setNewInvoice(p => ({ ...p, client: e.target.value }))}
                placeholder="Club LIV Miami" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500" />
            </div>
            <div className="w-40">
              <label className="block text-xs text-zinc-500 mb-1.5">Amount ($)</label>
              <input type="number" value={newInvoice.amount} onChange={e => setNewInvoice(p => ({ ...p, amount: e.target.value }))}
                placeholder="1500" className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-sky-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={addInvoice} className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-6 py-2 rounded-lg">Save</button>
            <button onClick={() => setAddingInvoice(false)} className="text-zinc-500 text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {/* Invoices table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">
            <div className="text-4xl mb-3">💰</div>
            No invoices yet. Create one above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Client", "Amount", "Status", "Due date", "Reminders", "Actions"].map(h => (
                  <th key={h} className="text-left text-xs font-mono text-zinc-500 uppercase tracking-widest px-6 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                  <td className="px-6 py-4 text-sm text-zinc-300 font-medium">{inv.client}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300 font-mono">${inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-mono px-2 py-1 rounded border ${STATUS_STYLES[inv.status]}`}>{inv.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{inv.remindersSent}/3</td>
                  <td className="px-6 py-4">
                    {inv.status !== "paid" && (
                      <button onClick={() => markPaid(inv.id)}
                        className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors">
                        Mark paid
                      </button>
                    )}
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
