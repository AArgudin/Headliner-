import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">ROSTER</span>
          <span className="text-xs text-zinc-500 font-mono uppercase tracking-widest mt-1">beta</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">5 agents. 0 overhead.</span>
          <Link href="/login" className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Get access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-8 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          Powered by Claude Fable 5 — Anthropic's most capable model
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-none mb-6">
          Your operator.<br />
          <span className="text-sky-400">Not your advisor.</span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-xl mb-12 leading-relaxed">
          ROSTER runs your music career's entire back office — bookings, content, invoices, PR — autonomously. You make music. Your agents handle everything else.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/login" className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            Start free — 14 days
          </Link>
          <Link href="/login" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
            View demo →
          </Link>
        </div>

        {/* Agents grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl w-full">
          {[
            { name: "Booking Agent", desc: "Replies to inquiries, drafts contracts", icon: "📅" },
            { name: "Content Agent", desc: "Writes & schedules posts daily", icon: "📱" },
            { name: "Revenue Agent", desc: "Tracks income, chases invoices", icon: "💰" },
            { name: "PR Agent", desc: "Pitches blogs & curators", icon: "📣" },
            { name: "Intel Agent", desc: "Monday brief — what matters", icon: "🧠" },
          ].map((agent) => (
            <div key={agent.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left">
              <div className="text-2xl mb-2">{agent.icon}</div>
              <div className="text-xs font-semibold text-white mb-1">{agent.name}</div>
              <div className="text-xs text-zinc-500 leading-relaxed">{agent.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing strip */}
      <div className="border-t border-zinc-800 px-8 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { tier: "Solo", price: "$49", period: "/mo", features: ["2 agents", "20 posts/mo", "Weekly brief"], cta: "Get started" },
            { tier: "Artist", price: "$149", period: "/mo", features: ["All 5 agents", "Booking automation", "PR outreach (30/mo)", "Revenue tracking"], cta: "Most popular", featured: true },
            { tier: "Agency", price: "$349", period: "/mo", features: ["Up to 10 artists", "Roster dashboard", "White-label option", "Dedicated support"], cta: "For agencies" },
          ].map((plan) => (
            <div key={plan.tier} className={`rounded-xl p-6 ${plan.featured ? "bg-sky-950 border-2 border-sky-500" : "bg-zinc-900 border border-zinc-800"}`}>
              <div className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-2">{plan.tier}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-500 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-zinc-400 flex items-center gap-2">
                    <span className="text-sky-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/login" className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${plan.featured ? "bg-sky-500 hover:bg-sky-400 text-white" : "border border-zinc-700 hover:border-zinc-500 text-zinc-300"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-zinc-800 px-8 py-6 text-center">
        <p className="text-zinc-600 text-sm font-mono">ROSTER — Built for DJs and electronic music artists · Miami, FL</p>
      </footer>
    </main>
  )
}
