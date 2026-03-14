"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { useState } from "react"
import {
  LayoutDashboard, Mail, Share2, Megaphone, BarChart3,
  Settings, LogOut, Menu, X, ChevronRight,
  Users, FileText, Send
} from "lucide-react"

const NAV = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    label: "Social",
    items: [
      { name: "Social Media", href: "/social", icon: Share2 },
      { name: "Analytics", href: "/social/analytics", icon: BarChart3 },
      { name: "Posts", href: "/social/posts", icon: FileText },
      { name: "Accounts", href: "/social/accounts", icon: Users },
    ]
  },
  {
    label: "Email",
    items: [
      { name: "Campaigns", href: "/email/campaigns", icon: Send },
      { name: "Contacts", href: "/email/contacts", icon: Users },
      { name: "Templates", href: "/email/templates", icon: FileText },
    ]
  },
  {
    label: "Ads",
    items: [
      { name: "Ads & Campaigns", href: "/ads", icon: Megaphone },
    ]
  }
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="sidebar flex flex-col h-full w-64 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Share2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">MarketingOS</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User pill */}
      <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-lg flex items-center gap-3" style={{ background: "hsl(var(--sidebar-hover-bg))" }}>
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[11px]" style={{ color: "hsl(var(--sidebar-text))" }}>Active</span>
          </div>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 px-3 py-3 space-y-5 overflow-y-auto">
        {NAV.map(group => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--sidebar-text) / 0.5)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`sidebar-link ${active ? "active" : ""}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <Link href="/settings" className="sidebar-link">
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>
        <button onClick={logout} className="sidebar-link w-full text-left" style={{ color: "hsl(0 84% 70%)" }}>
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (pathname === "/login" || pathname === "/signup") return <>{children}</>
  if (!user) return null

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-64 h-full animate-slide-in-left" onClick={e => e.stopPropagation()}>
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-border shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold text-sm gradient-text">MarketingOS</span>
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
