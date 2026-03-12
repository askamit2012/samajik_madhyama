"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../components/auth-provider"
import { TrendingUp, BarChart3, CheckCircle, Clock, FileEdit, AlertCircle, Facebook, Instagram, Linkedin, Twitter, Globe } from "lucide-react"

interface Post {
  id: number
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  createdAt: string
  publishedAt: string | null
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  facebook: { label: "Facebook", color: "#1877F2", Icon: Facebook },
  instagram: { label: "Instagram", color: "#E1306C", Icon: Instagram },
  linkedin: { label: "LinkedIn", color: "#0077B5", Icon: Linkedin },
  twitter: { label: "Twitter/X", color: "#000000", Icon: Twitter },
  google: { label: "Google", color: "#DB4437", Icon: Globe },
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-32 w-full">
      {data.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted-foreground">{value > 0 ? value : ""}</span>
          <div
            className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
            style={{ height: `${Math.max((value / max) * 100, value > 0 ? 8 : 2)}%` }}
            title={`${label}: ${value} posts`}
          />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { token } = useAuth()
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

  // Platform breakdown
  const platformStats = Object.keys(PLATFORM_CONFIG).map(platform => ({
    platform,
    total: posts.filter(p => p.platform === platform).length,
    published: posts.filter(p => p.platform === platform && p.status === "published").length,
    scheduled: posts.filter(p => p.platform === platform && p.status === "scheduled").length,
    draft: posts.filter(p => p.platform === platform && p.status === "draft").length,
  })).filter(s => s.total > 0)

  // Monthly post activity (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = date.toLocaleString("en-US", { month: "short" })
    const value = posts.filter(p => {
      const d = new Date(p.createdAt)
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
    }).length
    return { label, value }
  })

  // Status summary
  const statusCounts = {
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    draft: posts.filter(p => p.status === "draft").length,
    failed: posts.filter(p => p.status === "failed").length,
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track the performance of your social content</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Published", value: statusCounts.published, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Scheduled", value: statusCounts.scheduled, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Drafts", value: statusCounts.draft, icon: FileEdit, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Failed", value: statusCounts.failed, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="text-3xl font-bold">{loading ? "—" : value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Posts per Month</h2>
          </div>
          {loading ? (
            <div className="h-32 bg-muted/30 rounded-lg animate-pulse" />
          ) : posts.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No post data yet</div>
          ) : (
            <SimpleBarChart data={monthlyData} />
          )}
        </div>

        {/* Platform Breakdown */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Platform Breakdown</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
            </div>
          ) : platformStats.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No platform data yet</div>
          ) : (
            <div className="space-y-3">
              {platformStats.map(({ platform, total, published }) => {
                const cfg = PLATFORM_CONFIG[platform]
                const PIcon = cfg?.Icon || Globe
                const pct = total > 0 ? Math.round((published / total) * 100) : 0
                return (
                  <div key={platform} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PIcon size={14} color={cfg?.color} />
                        <span className="text-sm font-medium">{cfg?.label || platform}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{total} posts · {published} published</span>
                    </div>
                    <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg?.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post history table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-semibold">Post History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No posts yet</div>
        ) : (
          <div className="divide-y divide-border">
            {posts.slice(0, 20).map(post => {
              const cfg = PLATFORM_CONFIG[post.platform]
              const PIcon = cfg?.Icon || Globe
              return (
                <div key={post.id} className="flex items-start gap-4 p-4 hover:bg-muted/10 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    <PIcon size={16} color={cfg?.color} />
                  </div>
                  <p className="text-sm flex-1 line-clamp-1 text-foreground">{post.content}</p>
                  <div className="flex items-center gap-3 shrink-0">
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
