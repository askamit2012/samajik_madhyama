"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../components/auth-provider"
import { api } from "../../../lib/api"
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
    Promise.all([
      api.get<Post[]>("/posts", token),
      api.get<{ platform: string }[]>("/oauth/connections", token),
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
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-fade-in">
      <div className="animate-slide-up">
        <div className="flex items-center gap-2 text-primary font-bold mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">Insights Central</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Social <span className="gradient-text">Analytics</span></h1>
        <p className="text-muted-foreground text-lg mt-1 font-medium italic opacity-70">"You can't manage what you can't measure."</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        {[
          { label: "Published Content", value: statusCounts.published, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10", shadow: "shadow-emerald-500/5" },
          { label: "Planned Posts", value: statusCounts.scheduled, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", shadow: "shadow-blue-500/5" },
          { label: "Future Drafts", value: statusCounts.draft, icon: FileEdit, color: "text-violet-500", bg: "bg-violet-500/10", shadow: "shadow-violet-500/5" },
          { label: "Failed Attempts", value: statusCounts.failed, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", shadow: "shadow-red-500/5" },
        ].map(({ label, value, icon: Icon, color, bg, shadow }) => (
          <div key={label} className={`group bg-white border border-border rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${shadow}`}>
            <div className={`inline-flex p-3 rounded-2xl ${bg} mb-5 group-hover:rotate-6 transition-transform`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="text-4xl font-black tracking-tight">{loading ? "..." : value.toLocaleString()}</div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Activity Chart */}
        <div className="lg:col-span-2 bg-white border border-border rounded-[3rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                 <BarChart3 className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black tracking-tight">Publication Velocity</h2>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-500">6 Month Window</div>
          </div>
          <div className="min-h-[220px] flex items-end">
            {loading ? (
              <div className="h-40 w-full bg-slate-50 rounded-[2rem] animate-shimmer" />
            ) : posts.length === 0 ? (
              <div className="h-40 w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                 <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center opacity-30">
                    <BarChart3 className="h-6 w-6" />
                 </div>
                 <p className="text-sm font-bold">No publication data available yet</p>
              </div>
            ) : (
              <div className="flex-1">
                 <SimpleBarChart data={monthlyData} />
              </div>
            )}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-[3rem] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
               <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Channel Share</h2>
          </div>
          {loading ? (
            <div className="space-y-6">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl animate-pulse" />)}
            </div>
          ) : platformStats.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-500 font-bold">No active channels</div>
          ) : (
            <div className="space-y-8">
              {platformStats.map(({ platform, total, published }, i) => {
                const cfg = PLATFORM_CONFIG[platform]
                const PIcon = cfg?.Icon || Globe
                const pct = total > 0 ? Math.round((published / total) * 100) : 0
                return (
                  <div key={platform} className="space-y-3 animate-slide-in-left" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cfg?.color}22` }}>
                           <PIcon size={16} color={cfg?.color} />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{cfg?.label || platform}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{published} / {total} PUB</span>
                    </div>
                    <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out" 
                           style={{ width: `${pct}%`, backgroundColor: cfg?.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post history table */}
      <div className="bg-white border border-border rounded-[3rem] shadow-sm overflow-hidden animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="p-8 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">Engagement History</h2>
          <div className="px-4 py-1.5 bg-slate-50 border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">Latest 20 Operations</div>
        </div>
        {loading ? (
          <div className="p-20 flex flex-col items-center gap-4">
             <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-sm font-bold text-slate-400">Synchronizing History...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-24 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
               <FileEdit size={32} />
            </div>
            <h3 className="text-lg font-black tracking-tight">History is quiet.</h3>
            <p className="text-muted-foreground font-medium mt-1">Start publishing to see your operational timeline here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Content Preview</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Channel</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.slice(0, 20).map((post, i) => {
                    const cfg = PLATFORM_CONFIG[post.platform]
                    const PIcon = cfg?.Icon || Globe
                    return (
                      <tr key={post.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                           <p className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-slate-900 transition-colors">{post.content}</p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-2">
                              <PIcon size={14} color={cfg?.color} />
                              <span className="text-xs font-bold text-slate-600">{cfg?.label || post.platform}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                             post.status === "published" ? "bg-emerald-50 text-emerald-600" :
                             post.status === "scheduled" ? "bg-blue-50 text-blue-600" :
                             post.status === "failed" ? "bg-red-50 text-red-600" :
                             "bg-slate-100 text-slate-500"
                           }`}>{post.status}</span>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-xs font-bold text-slate-400">
                             {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  )
}
