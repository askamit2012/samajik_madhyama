"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "../components/auth-provider"
import { api } from "../lib/api"
import {
  Share2, Mail, TrendingUp, Users, Zap, ArrowUpRight,
  Plus, Calendar, CheckCircle, Clock, FileEdit,
  Facebook, Instagram, Linkedin, Twitter, Globe,
  LayoutDashboard, Activity, BarChart3, ChevronRight,
  PlusCircle, Sparkles
} from "lucide-react"
import { Button } from "@repo/ui"

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2", instagram: "#E1306C",
  linkedin: "#0077B5", twitter: "#14171A", google: "#DB4437"
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  const p = { size: 14, color: PLATFORM_COLORS[platform] || "#888" }
  switch (platform) {
    case "facebook": return <Facebook {...p} />
    case "instagram": return <Instagram {...p} />
    case "linkedin": return <Linkedin {...p} />
    case "twitter": return <Twitter {...p} />
    default: return <Globe {...p} />
  }
}

function QuickActionCard({ icon: Icon, label, desc, href, color, delay = 0 }: {
  icon: any; label: string; desc: string; href: string; color: string; delay?: number
}) {
  return (
    <Link href={href} 
      style={{ animationDelay: `${delay}ms` }}
      className="group relative bg-white border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full cursor-pointer">
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 blur-2xl`} style={{ backgroundColor: color }} />
      
      <div className="h-14 w-14 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-slate-100"
        style={{ backgroundColor: color + "10" }}>
        <Icon size={24} style={{ color }} />
      </div>
      
      <div className="space-y-1 mb-6 flex-grow">
        <p className="text-xl font-black tracking-tight text-slate-800">{label}</p>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
        Inhibit Action <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}

export default function HomePage() {
  const { token, user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<any[]>("/posts", token),
      api.get<any[]>("/oauth/connections", token),
    ]).then(([p, c]) => {
      setPosts(Array.isArray(p) ? p : [])
      setConnections(Array.isArray(c) ? c : [])
    }).finally(() => setLoading(false))
  }, [token])

  const greeting = time.getHours() < 12 ? "Good morning" : time.getHours() < 17 ? "Good afternoon" : "Good evening"
  const stats = {
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    active_campaigns: 0, // Mock for now
    connected: connections.length,
  }

  const recentPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in custom-scrollbar">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">{time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            {greeting}, <span className="gradient-text">{user?.name?.split(" ")[0] || 'User'}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Your marketing infrastructure is operational.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/social/posts">
             <Button className="rounded-2xl h-12 px-8 gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all">
                <PlusCircle className="h-4 w-4" /> Compose Post
             </Button>
           </Link>
        </div>
      </div>

      {/* Overview Stat Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        {[
          { label: "Total Reach", value: stats.published, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Active Queue", value: stats.scheduled, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Linked Accounts", value: stats.connected, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Growth Index", value: "+12.4%", icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500/10" },
        ].map((s, i) => (
          <div key={i} className="stat-card group">
             <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}>
                   <s.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
             <div className="text-3xl font-black tracking-tight">{loading ? "..." : s.value}</div>
             <div className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
           <Sparkles className="h-4 w-4 text-primary" />
           <h2 className="text-lg font-black tracking-tight text-slate-800">Operational Launchpad</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            icon={Share2} delay={100}
            label="Social Post" desc="Dispatch content across platforms."
            href="/social/posts" color="#4f46e5"
          />
          <QuickActionCard
            icon={Mail} delay={200}
            label="Email Launch" desc="Deploy campaigns to your audience."
            href="/email/campaigns" color="#0891b2"
          />
          <QuickActionCard
            icon={Users} delay={300}
            label="Audience Hub" desc="Manage contacts and segments."
            href="/email/contacts" color="#059669"
          />
          <QuickActionCard
            icon={BarChart3} delay={400}
            label="Insight Desk" desc="Analyze operational performance."
            href="/social/analytics" color="#d97706"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Log */}
        <div className="lg:col-span-2 bg-white border-2 border-border rounded-[3rem] shadow-sm overflow-hidden flex flex-col animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between px-10 py-8 border-b border-border bg-slate-50/30">
            <h2 className="text-xl font-black tracking-tight">Recent Activity Log</h2>
            <Link href="/social/posts" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Full Log →</Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-10 py-6 h-20 animate-shimmer" />
              ))
            ) : recentPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 text-slate-200 animate-float">
                  <Activity size={32} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Silent Channels</h3>
                <p className="text-xs text-muted-foreground font-medium mt-1">No outbound data detected recently.</p>
              </div>
            ) : recentPosts.map((post, i) => (
              <div key={post.id} className="group flex items-center gap-6 px-10 py-6 hover:bg-slate-50/80 transition-all duration-300">
                <div className="h-12 w-12 rounded-[1.25rem] bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all duration-500">
                  <PlatformIcon platform={post.platform} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{post.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                      post.status === "published" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                      post.status === "scheduled" ? "bg-blue-50 border-blue-100 text-blue-600" :
                      post.status === "failed" ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}>{post.status}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                <Link href="/social/posts" className="p-3 rounded-xl bg-slate-50 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Connectivity Status */}
        <div className="bg-[#0F172A] border-2 border-slate-800 rounded-[3rem] shadow-2xl p-8 flex flex-col animate-slide-up" style={{ animationDelay: '600ms' }}>
          <div className="mb-10">
            <h2 className="text-xl font-black text-white tracking-tight">Matrix Connectivity</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Integration Protocols</p>
          </div>
          <div className="space-y-4 flex-grow">
            {["facebook", "instagram", "linkedin", "twitter", "google"].map(platform => {
              const connected = connections.some(c => c.platform === platform)
              const names: Record<string, string> = {
                facebook: "Facebook", instagram: "Instagram",
                linkedin: "LinkedIn", twitter: "X / Twitter", google: "Google Matrix"
              }
              return (
                <div key={platform}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-500 ${
                    connected 
                      ? "border-emerald-500/20 bg-emerald-500/5 text-slate-200" 
                      : "border-slate-800 bg-slate-900/50 text-slate-500"
                  }`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${connected ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-600'}`}>
                      <PlatformIcon platform={platform} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">{names[platform] || platform}</span>
                  </div>
                  {connected
                    ? <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
                    : <Link href="/social/accounts" className="text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-300 tracking-widest transition-colors">Initialize</Link>
                  }
                </div>
              )
            })}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
             <Link href="/social/accounts" className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors">
                Configure Global Protocols
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
