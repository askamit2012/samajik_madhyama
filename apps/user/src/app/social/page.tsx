"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "../../components/auth-provider"
import {
  Share2, FileText, Clock, CheckCircle, TrendingUp, Plus,
  Facebook, Instagram, Linkedin, Twitter, Globe
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
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch("http://localhost:4000/posts", { headers: h }).then(r => r.json()),
      fetch("http://localhost:4000/oauth/connections", { headers: h }).then(r => r.json()),
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
    { label: "Connected", value: stats.connected, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Media</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>. Here's what's happening.
          </p>
        </div>
        <Link href="/social/posts">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Compose Post
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-3xl font-bold tracking-tight">{loading ? "—" : value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-semibold text-lg">Recent Posts</h2>
            <Link href="/social/posts" className="text-sm text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : recentPosts.length === 0 ? (
              <div className="p-10 text-center">
                <Share2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No posts yet. Start composing!</p>
                <Link href="/social/posts">
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <Plus className="h-3.5 w-3.5" /> Create first post
                  </Button>
                </Link>
              </div>
            ) : recentPosts.map(post => (
              <div key={post.id} className="flex items-start gap-4 p-5 hover:bg-muted/10 transition-colors">
                <div className="mt-0.5">
                  <PlatformIcon platform={post.platform} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2 text-foreground">{post.content}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      post.status === "published" ? "bg-emerald-500/10 text-emerald-600" :
                      post.status === "scheduled" ? "bg-blue-500/10 text-blue-600" :
                      post.status === "failed" ? "bg-red-500/10 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>{post.status}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-semibold text-lg">Connected</h2>
            <Link href="/social/accounts" className="text-sm text-primary hover:underline">Manage →</Link>
          </div>
          <div className="p-4 space-y-2">
            {["facebook", "instagram", "linkedin", "twitter", "google"].map(platform => {
              const isConnected = connections.some(c => c.platform === platform)
              return (
                <div key={platform} className={`flex items-center justify-between p-3 rounded-lg border ${
                  isConnected ? "border-primary/20 bg-primary/5" : "border-border bg-muted/20"
                }`}>
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={platform} />
                    <span className="text-sm font-medium capitalize">{platform === "twitter" ? "Twitter / X" : platform}</span>
                  </div>
                  {isConnected ? (
                    <div className="h-2 w-2 rounded-full bg-emerald-500" title="Connected" />
                  ) : (
                    <Link href="/social/accounts">
                      <span className="text-xs text-primary hover:underline">Connect</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
