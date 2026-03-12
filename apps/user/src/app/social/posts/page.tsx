"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../../components/auth-provider"
import { Button } from "@repo/ui"
import {
  Send, Clock, FileEdit, X, CheckCircle, AlertCircle,
  Facebook, Instagram, Linkedin, Twitter, Globe, ChevronDown,
  Edit, Trash2, Zap, Calendar
} from "lucide-react"

interface Post {
  id: number
  content: string
  platform: string
  status: string
  scheduledFor: string | null
  createdAt: string
  publishedAt: string | null
}

interface Connection { platform: string }

import { LucideProps } from "lucide-react"

interface PlatformCfg {
  label: string
  color: string
  maxChars: number
  Icon: React.ComponentType<LucideProps>
}

const PLATFORM_CONFIG: Record<string, PlatformCfg> = {
  facebook: { label: "Facebook", color: "#1877F2", maxChars: 63206, Icon: Facebook },
  instagram: { label: "Instagram", color: "#E1306C", maxChars: 2200, Icon: Instagram },
  linkedin: { label: "LinkedIn", color: "#0077B5", maxChars: 3000, Icon: Linkedin },
  twitter: { label: "Twitter/X", color: "#000000", maxChars: 280, Icon: Twitter },
  google: { label: "Google", color: "#DB4437", maxChars: 10000, Icon: Globe },
}

function PostPreview({ content, platform }: { content: string; platform: string }) {
  const cfg = PLATFORM_CONFIG[platform]
  if (!cfg) return null

  if (platform === "twitter") {
    return (
      <div className="border rounded-xl p-4 bg-card space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-sm">Your Account</span>
              <span className="text-muted-foreground text-sm">@handle · now</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content || <span className="text-muted-foreground italic">Your post will appear here...</span>}</p>
            <div className="flex items-center gap-5 mt-3 text-muted-foreground">
              {["💬 0", "🔁 0", "❤️ 0", "📤"].map(icon => (
                <span key={icon} className="text-xs">{icon}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (platform === "instagram") {
    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center gap-3 p-3 border-b border-border">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]" />
          <span className="font-semibold text-sm">your_account</span>
        </div>
        <div className="h-52 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-sm">
          📷 Photo / Video preview
        </div>
        <div className="p-3 space-y-1">
          <div className="flex gap-3 text-lg">
            <span>🤍</span><span>💬</span><span>📤</span>
            <span className="ml-auto">🔖</span>
          </div>
          <p className="text-sm"><span className="font-semibold">your_account</span> {content || <span className="text-muted-foreground italic">Your caption here...</span>}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Just now</p>
        </div>
      </div>
    )
  }

  if (platform === "linkedin") {
    return (
      <div className="border rounded-xl p-4 bg-card space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white font-bold">
            Y
          </div>
          <div>
            <p className="font-semibold text-sm">Your Name</p>
            <p className="text-xs text-muted-foreground">Your Title • Now • 🌐</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content || <span className="text-muted-foreground italic">Your post will appear here...</span>}</p>
        <div className="border-t border-border pt-2 flex gap-4 text-xs text-muted-foreground">
          {["👍 Like", "💬 Comment", "🔁 Repost", "📤 Send"].map(a => (
            <button key={a} className="hover:text-foreground transition-colors">{a}</button>
          ))}
        </div>
      </div>
    )
  }

  // Facebook default
  return (
    <div className="border rounded-xl p-4 bg-card space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">Your Page</p>
          <p className="text-xs text-muted-foreground">Just now · 🌐</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content || <span className="text-muted-foreground italic">Your post will appear here...</span>}</p>
      <div className="border-t border-border pt-2 flex gap-4 text-sm text-muted-foreground">
        {["👍 Like", "💬 Comment", "🔁 Share"].map(a => (
          <button key={a} className="hover:text-foreground transition-colors font-medium">{a}</button>
        ))}
      </div>
    </div>
  )
}

type FilterTab = "all" | "draft" | "scheduled" | "published" | "failed"

export default function PostsPage() {
  const { token } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all")
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  // Composer state
  const [content, setContent] = useState("")
  const [platform, setPlatform] = useState("")
  const [postType, setPostType] = useState<"now" | "schedule" | "draft">("now")
  const [scheduledFor, setScheduledFor] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }

  useEffect(() => {
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch("http://localhost:4000/posts", { headers: h }).then(r => r.json()),
      fetch("http://localhost:4000/oauth/connections", { headers: h }).then(r => r.json()),
    ]).then(([postsData, connsData]) => {
      setPosts(Array.isArray(postsData) ? postsData.reverse() : [])
      setConnections(Array.isArray(connsData) ? connsData : [])
      if (connsData?.length > 0) setPlatform(connsData[0].platform)
    }).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const maxChars = PLATFORM_CONFIG[platform]?.maxChars ?? 2000
  const remaining = maxChars - content.length
  const cfg = PLATFORM_CONFIG[platform]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !platform) return
    setSubmitting(true)
    setErrorMsg("")
    try {
      const status = postType === "draft" ? "draft" : postType === "schedule" ? "scheduled" : "draft"
      const res = await fetch("http://localhost:4000/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({ content, platform, status, scheduledFor: postType === "schedule" ? scheduledFor : null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const newPost = await res.json()

      if (postType === "now") {
        // Immediately publish
        const pubRes = await fetch(`http://localhost:4000/posts/${newPost.id}/publish`, {
          method: "POST", headers
        })
        const pubData = await pubRes.json()
        setPosts(prev => [pubRes.ok ? pubData.post : { ...newPost, status: "failed" }, ...prev])
        if (pubRes.ok) {
          setSuccessMsg(`Published to ${cfg?.label}! 🎉`)
        } else {
          setErrorMsg(pubData.error || "Publish failed")
        }
      } else {
        setPosts(prev => [newPost, ...prev])
        setSuccessMsg(postType === "schedule" ? "Post scheduled! 📅" : "Draft saved! 📝")
      }

      setContent("")
      setScheduledFor("")
      setTimeout(() => setSuccessMsg(""), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (post: Post) => {
    setPublishing(post.id)
    try {
      const res = await fetch(`http://localhost:4000/posts/${post.id}/publish`, {
        method: "POST", headers
      })
      const data = await res.json()
      setPosts(prev => prev.map(p => p.id === post.id ? (res.ok ? data.post : { ...p, status: "failed" }) : p))
    } catch (err) {
      console.error(err)
    } finally {
      setPublishing(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return
    setDeleting(id)
    try {
      await fetch(`http://localhost:4000/posts/${id}`, { method: "DELETE", headers })
      setPosts(prev => prev.filter(p => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const filteredPosts = posts.filter(p => activeFilter === "all" ? true : p.status === activeFilter)
  const filterCounts: Record<FilterTab, number> = {
    all: posts.length,
    draft: posts.filter(p => p.status === "draft").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    published: posts.filter(p => p.status === "published").length,
    failed: posts.filter(p => p.status === "failed").length,
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* LEFT — Composer */}
      <div className="w-full lg:w-[420px] shrink-0 flex flex-col border-r border-border overflow-y-auto bg-card">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold">Compose</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create content for your connected platforms</p>
        </div>

        {connections.length === 0 && !loading ? (
          <div className="p-6">
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              No connected accounts. <a href="/social/accounts" className="font-semibold underline">Connect a platform →</a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-0 flex-1">
            {/* Platform selector */}
            <div className="p-4 border-b border-border">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2 block">Platform</label>
              <div className="flex flex-wrap gap-2">
                {connections.map(c => {
                  const pcfg = PLATFORM_CONFIG[c.platform]
                  const PIcon = pcfg?.Icon || Globe
                  return (
                    <button
                      key={c.platform} type="button"
                      onClick={() => setPlatform(c.platform)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        platform === c.platform ? "text-white border-transparent" : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                      }`}
                      style={platform === c.platform ? { backgroundColor: pcfg?.color } : {}}
                    >
                      <PIcon size={13} color={platform === c.platform ? "#fff" : pcfg?.color} />
                      {pcfg?.label || c.platform}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Text area */}
            <div className="p-4 flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full text-sm leading-relaxed resize-none focus:outline-none bg-transparent min-h-[160px]"
                placeholder={`What would you like to share${cfg ? ` on ${cfg.label}` : ""}?`}
              />
              {/* Char count */}
              <div className="flex justify-end mt-2">
                <div className={`text-xs font-medium ${remaining < 20 ? "text-red-500" : "text-muted-foreground"}`}>
                  {remaining < maxChars ? `${remaining} remaining` : `Max ${maxChars.toLocaleString()} chars`}
                </div>
              </div>
            </div>

            {/* Post type selector */}
            <div className="p-4 border-t border-border space-y-3">
              <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground block">When to post</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "now", label: "Post Now", icon: Zap },
                  { value: "schedule", label: "Schedule", icon: Calendar },
                  { value: "draft", label: "Draft", icon: FileEdit },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value} type="button"
                    onClick={() => setPostType(value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                      postType === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              {postType === "schedule" && (
                <input type="datetime-local" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)}
                  required className="w-full p-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              )}
            </div>

            {/* Feedback messages */}
            {successMsg && (
              <div className="mx-4 mb-2 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mx-4 mb-2 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                <button onClick={() => setErrorMsg("")} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* Submit */}
            <div className="p-4 border-t border-border">
              <Button type="submit" className="w-full gap-2" disabled={!content.trim() || !platform || submitting || remaining < 0}
                style={{ backgroundColor: cfg?.color || undefined }}>
                {postType === "now" ? <><Send className="h-4 w-4" /> {submitting ? "Publishing..." : `Publish to ${cfg?.label}`}</> :
                 postType === "schedule" ? <><Clock className="h-4 w-4" /> {submitting ? "Scheduling..." : "Schedule Post"}</> :
                 <><FileEdit className="h-4 w-4" /> Save Draft</>}
              </Button>
            </div>

            {/* Live Preview */}
            {content && platform && (
              <div className="p-4 border-t border-border">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">Preview</p>
                <PostPreview content={content} platform={platform} />
              </div>
            )}
          </form>
        )}
      </div>

      {/* RIGHT — Queue */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Content Queue</h2>
          {/* Filter tabs */}
          <div className="flex gap-1 mt-4 bg-muted/30 p-1 rounded-lg w-fit">
            {(["all", "draft", "scheduled", "published", "failed"] as FilterTab[]).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                  activeFilter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                {f} {filterCounts[f] > 0 && <span className="ml-1 opacity-60">({filterCounts[f]})</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted/30 rounded-xl animate-pulse" />)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <FileEdit className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg">No {activeFilter === "all" ? "" : activeFilter} posts</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {activeFilter === "all" ? "Compose your first post using the panel on the left." : `No ${activeFilter} posts found.`}
              </p>
            </div>
          ) : filteredPosts.map(post => {
            const pcfg = PLATFORM_CONFIG[post.platform]
            const PIcon = pcfg?.Icon || Globe
            return (
              <div key={post.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
                style={{ borderLeftColor: pcfg?.color || "#888", borderLeftWidth: 3 }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2.5">
                    <PIcon size={16} color={pcfg?.color} />
                    <span className="text-sm font-semibold" style={{ color: pcfg?.color }}>{pcfg?.label || post.platform}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      post.status === "published" ? "bg-emerald-500/10 text-emerald-600" :
                      post.status === "scheduled" ? "bg-blue-500/10 text-blue-600" :
                      post.status === "failed" ? "bg-red-500/10 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>{post.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {post.scheduledFor
                      ? `📅 ${new Date(post.scheduledFor).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <p className="text-sm leading-relaxed line-clamp-3 text-foreground">{post.content}</p>
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                  {(post.status === "draft" || post.status === "failed") && (
                    <Button size="sm" variant="default" onClick={() => handlePublish(post)}
                      disabled={publishing === post.id}
                      style={{ backgroundColor: pcfg?.color }}
                      className="gap-1.5 text-white">
                      <Zap className="h-3.5 w-3.5" />
                      {publishing === post.id ? "Publishing..." : "Publish Now"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => { setEditingPost(post); setContent(post.content); setPlatform(post.platform) }}>
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline"
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleDelete(post.id)} disabled={deleting === post.id}>
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting === post.id ? "..." : "Delete"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
