"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { LayoutDashboard, Mail, Share2, Megaphone, Settings, LogOut, Menu, X, BarChart3 } from "lucide-react"
import { useState } from "react"
import { Button } from "@repo/ui"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Don't show layout on auth pages
  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>
  }
  
  // Show nothing while verifying session so it doesn't flash
  if (!user) return null

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Email Marketing", href: "/email", icon: Mail },
    { name: "Social Media", href: "/social", icon: Share2 },
    { name: "Analytics", href: "/social/analytics", icon: BarChart3, indent: true },
    { name: "Ads & Campaigns", href: "/ads", icon: Megaphone },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border drop-shadow-sm">
      <div className="p-6 border-b border-border mb-4">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          MarketingOS
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <span className="text-sm font-medium text-muted-foreground truncate">{user.name}</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          // Highlight if current path starts with item.href (except for root "/")
          const isActive = item.href === "/" 
            ? pathname === "/" 
            : pathname.startsWith(item.href)
            
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          onClick={logout} 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Log out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header Menu */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
        <h2 className="text-lg font-bold">MarketingOS</h2>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="w-64 h-full animate-in slide-in-from-left">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  )
}
