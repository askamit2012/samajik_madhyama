"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "../../components/auth-provider"
import { api } from "../../lib/api"
import {
  Share2, FileText, Clock, CheckCircle, TrendingUp, Plus,
  Facebook, Instagram, Linkedin, Twitter, Globe, Zap, ChevronDown
} from "lucide-react"
import { Button } from "@repo/ui"

interface StatsData {
  total: number
  drafts: number
  scheduled: number
  published: number
  connected: number
}

interface Post {
  id: number
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  createdAt: string
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  linkedin: "#0077B5",
  twitter: "#000000",
  google: "#DB4437",
}

const PlatformIcon = ({ platform, size = 16 }: { platform: string; size?: number }) => {
  const props = { size, color: PLATFORM_COLORS[platform] || "#888" }
  switch (platform) {
    case "facebook": return <Facebook {...props} />
    case "instagram": return <Instagram {...props} />
    case "linkedin": return <Linkedin {...props} />
    case "twitter": return <Twitter {...props} />
    default: return <Globe {...props} />
  }
}

export default function SocialDashboardPage() {
  const { token, user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [connections, setConnections] = useState<{ platform: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<Post[]>("/posts", token),
      api.get<{ platform: string }[]>("/oauth/connections", token),
    ]).then(([postsData, connsData]) => {
      setPosts(Array.isArray(postsData) ? postsData : [])
      setConnections(Array.isArray(connsData) ? connsData : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const stats: StatsData = {
    total: posts.length,
    drafts: posts.filter(p => p.status === "draft").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    published: posts.filter(p => p.status === "published").length,
    connected: connections.length,
  }

  const recentPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  const statCards = [
    { label: "Total Posts", value: stats.total, icon: FileText, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Published", value: stats.published, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Connections", value: stats.connected, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Social <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>. Your overview for today.
          </p>
        </div>
        <Link href="/social/posts" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <Button size="lg" className="rounded-full px-8 gap-2 shadow-lg hover:shadow-primary/20 transition-all font-semibold">
            <Plus className="h-5 w-5" />
            Create Contents
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        {statCards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <div key={label} className="stat-card" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`inline-flex p-3 rounded-2xl ${bg} mb-4 animate-scale-in`} style={{ animationDelay: `${i * 100}ms` }}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div className="space-y-1">
              <div className="text-4xl font-black tracking-tighter">{loading ? "—" : value}</div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{label}</div>
            </div>
            {/* Subtle graph line placeholder */}
            <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
               <div className={`h-full ${bg.replace('/10', '')} w-2/3 animate-slide-in-left`} style={{ animationDelay: `${500 + i * 100}ms` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <Link href="/social/posts" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              View all posts <ChevronDown className="h-3 w-3 -rotate-90" />
            </Link>
          </div>
          
          <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="p-12 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-10 w-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center p-10 stagger-children">
                <div className="h-20 w-20 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-6 animate-float">
                  <Share2 className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Ready to go viral?</h3>
                <p className="text-muted-foreground max-w-xs mb-8">
                  Your social performance starts with your first post. Let's create something brilliant.
                </p>
                <Link href="/social/posts">
                  <Button variant="outline" className="rounded-full px-6 gap-2 border-2">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" /> Start Composing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentPosts.map((post, i) => (
                  <div key={post.id} className="group flex items-start gap-5 p-6 hover:bg-muted/30 transition-all cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="relative">
                      <div className="p-3 rounded-2xl bg-white border border-border shadow-sm group-hover:shadow-md transition-all">
                        <PlatformIcon platform={post.platform} size={22} />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                        post.status === "published" ? "bg-emerald-500" :
                        post.status === "scheduled" ? "bg-blue-500" : "bg-slate-400"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium leading-relaxed line-clamp-2 text-foreground mb-2 group-hover:text-primary transition-colors">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <div className={`flex items-center gap-1.5 ${
                          post.status === "published" ? "text-emerald-600" :
                          post.status === "scheduled" ? "text-blue-600" : ""
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${
                             post.status === "published" ? "bg-emerald-500" :
                             post.status === "scheduled" ? "bg-blue-500" : "bg-current"
                          }`} />
                          {post.status}
                        </div>
                        <span className="opacity-40">•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
                        {post.scheduledFor && (
                          <>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1 text-blue-600">
                               <Clock className="h-3 w-3" /> {new Date(post.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="rounded-full">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="space-y-8 stagger-children" style={{ animationDelay: '300ms' }}>
          {/* Platforms Glass Card */}
          <div className="glass rounded-[2.5rem] p-8 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">Platforms</h3>
              <Link href="/social/accounts" className="p-2 rounded-full hover:bg-white/50 transition-colors">
                <Plus className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {["facebook", "instagram", "linkedin", "twitter"].map((platform, i) => {
                const isConnected = connections.some(c => c.platform === platform)
                return (
                  <div key={platform} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    isConnected 
                      ? "bg-white/80 border-white/50 shadow-sm hover:shadow-md" 
                      : "bg-white/30 border-dashed border-border/60 hover:border-primary/30"
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl transition-all ${isConnected ? "bg-white" : "grayscale opacity-50"}`}>
                        <PlatformIcon platform={platform} size={18} />
                      </div>
                      <span className={`text-sm font-bold capitalize ${isConnected ? "text-foreground" : "text-muted-foreground"}`}>
                        {platform === "twitter" ? "Twitter / X" : platform}
                      </span>
                    </div>
                    {isConnected ? (
                      <div className="relative h-2 w-2">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="relative h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                    ) : (
                      <Link href="/social/accounts" className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Connect
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-center text-muted-foreground/60 px-4">
              Connect more accounts to expand your reach across the digital landscape.
            </p>
          </div>

          {/* Quick Analytics Mini Card */}
           <Link href="/social/analytics" className="block group">
            <div className="bg-primary rounded-[2rem] p-8 text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden group-hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-20 w-20" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">Growth Insights</h3>
                <p className="text-primary-foreground/70 text-sm mb-6">See how your audience is reacting.</p>
                <div className="flex items-end gap-1 font-black text-3xl">
                  +12.4% <TrendingUp className="h-6 w-6 mb-1" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-60">Avg. Engagement</div>
              </div>
            </div>
           </Link>
        </div>
      </div>
    </div>
  )
}
