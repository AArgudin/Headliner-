"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⚡" },
  { href: "/bookings", label: "Bookings", icon: "📅" },
  { href: "/content", label: "Content", icon: "📱" },
  { href: "/revenue", label: "Revenue", icon: "💰" },
  { href: "/pr", label: "PR", icon: "📣" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-zinc-500 font-mono text-sm animate-pulse">Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-800 flex flex-col fixed h-screen">
        <div className="px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white tracking-tight">ROSTER</span>
            <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest">live</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sky-950 text-sky-300 font-medium"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-sky-900 flex items-center justify-center text-xs font-bold text-sky-300">
              {session?.user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-300 truncate">{session?.user?.name || "Artist"}</div>
              <div className="text-[10px] text-zinc-600 truncate">{session?.user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
