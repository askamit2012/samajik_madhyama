"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../../components/auth-provider"
import { api } from "../../../lib/api"
import { Button } from "@repo/ui"
import {
  Send, Clock, FileEdit, X, CheckCircle, AlertCircle,
  Facebook, Instagram, Linkedin, Twitter, Globe, ChevronDown,
  Edit, Trash2, Zap, Calendar, FileText, Wand2, ImagePlus, Sparkles, Brain, Cpu
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
  const { token, user } = useAuth()
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

  // AI Copilot State
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiBrief, setAiBrief] = useState("")
  const [aiTone, setAiTone] = useState("Professional")
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiVariants, setAiVariants] = useState<string[]>([])
  const [aiImagePrompt, setAiImagePrompt] = useState("")
  const [aiImageGenerating, setAiImageGenerating] = useState(false)
  const [mediaUrl, setMediaUrl] = useState("")

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<Post[]>("/posts", token),
      api.get<Connection[]>("/oauth/connections", token),
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
      const newPost = await api.post<Post>("/posts", {
        content, platform, status,
        scheduledFor: postType === "schedule" ? scheduledFor : null
      }, token)

      if (postType === "now") {
        const pubData = await api.post<{ post: Post }>(`/posts/${newPost.id}/publish`, {}, token)
        setPosts(prev => [pubData.post, ...prev])
        setSuccessMsg(`Published to ${cfg?.label}! 🎉`)
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

  const handleAiDraft = async () => {
    if (!aiBrief) return
    setAiGenerating(true)
    setAiVariants([])
    try {
      const data = await api.post<{ variants: string[] }>("/ai/draft-post", { brief: aiBrief, platform, tone: aiTone }, token)
      setAiVariants(data.variants)
    } catch (err: any) {
      setErrorMsg(err.message || "AI failed to respond")
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAiImage = async () => {
    if (!aiImagePrompt) return
    setAiImageGenerating(true)
    try {
      const data = await api.post<{ imageUrl: string }>("/ai/generate-image", { prompt: aiImagePrompt }, token)
      setMediaUrl(data.imageUrl)
      setSuccessMsg("AI Media generated!")
    } catch (err: any) {
      setErrorMsg(err.message || "Media generation failed")
    } finally {
      setAiImageGenerating(false)
    }
  }

  const handleSuggestTime = async () => {
    if (!platform) return
    try {
      const data = await api.post<{ suggestedTime: string }>("/ai/suggest-time", { platform }, token)
      setPostType("schedule")
      setScheduledFor(data.suggestedTime.slice(0, 16)) // Format for datetime-local
      setSuccessMsg("Found a peak engagement slot! 🚀")
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      setErrorMsg(err.message || "Could not find peak slot")
    }
  }

  const handlePublish = async (post: Post) => {
    setPublishing(post.id)
    try {
      const data = await api.post<{ post: Post }>(`/posts/${post.id}/publish`, {}, token)
      setPosts(prev => prev.map(p => p.id === post.id ? data.post : p))
    } catch { 
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: "failed" } : p))
    } finally {
      setPublishing(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this post?")) return
    setDeleting(id)
    try {
      await api.delete(`/posts/${id}`, token)
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
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      {/* LEFT — Dark Side Composer */}
      <div className="w-full lg:w-[460px] shrink-0 flex flex-col bg-[#0F172A] text-slate-300 border-r border-slate-800 animate-slide-in-left">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <Zap className="h-4 w-4 fill-primary" />
            <span className="text-xs uppercase tracking-[0.2em]">Studio</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Post Composer</h1>
          <p className="text-sm text-slate-500 mt-2">Craft your social media presence with perfection.</p>
        </div>

        {connections.length === 0 && !loading ? (
          <div className="p-8">
            <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-200">
              <h3 className="font-bold mb-1">No Accounts Connected</h3>
              <p className="text-sm opacity-80 mb-4">You need to connect at least one platform to start posting.</p>
              <Link href="/social/accounts">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl">Connect Platform</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
               {/* Platform Scroll */}
              <div className="p-8 pb-4">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 mb-4 block">Select Channels</label>
                <div className="flex flex-wrap gap-3">
                  {connections.map(c => {
                    const pcfg = PLATFORM_CONFIG[c.platform]
                    const PIcon = pcfg?.Icon || Globe
                    const isSelected = platform === c.platform
                    return (
                      <button
                        key={c.platform} type="button"
                        onClick={() => setPlatform(c.platform)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all duration-300 ${
                          isSelected 
                            ? "bg-slate-800 border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                            : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                        }`}
                      >
                        <PIcon size={16} color={isSelected ? pcfg?.color : "#64748b"} />
                        {pcfg?.label || c.platform}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Editor Shell */}
              <div className="p-8 pt-4 space-y-6">
                <div className="relative bg-slate-900/40 rounded-[2rem] border-2 border-slate-800 p-6 focus-within:border-primary/40 transition-colors group">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="w-full text-base leading-relaxed resize-none focus:outline-none bg-transparent min-h-[180px] text-slate-200 placeholder:text-slate-600"
                    placeholder={`What’s on your mind for ${cfg?.label || 'Social Media'}?`}
                  />

                  {mediaUrl && (
                    <div className="relative mt-4 aspect-video rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-800 animate-slide-up">
                       <img src={mediaUrl} alt="AI Generated" className="w-full h-full object-cover" />
                       <button type="button" onClick={() => setMediaUrl("")} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black transition-colors">
                          <X size={14} />
                       </button>
                    </div>
                  )}

                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <button type="button" onClick={() => setShowAiModal(true)} 
                        className="flex items-center gap-2 text-[10px] font-black tracking-widest py-1.5 px-4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all">
                        <Sparkles size={12} className="animate-pulse" />
                        CORTEX COPILOT
                      </button>
                      <div className={`text-[10px] font-black tracking-widest py-1 px-3 rounded-full border ${
                        remaining < 20 ? "border-red-500/50 text-red-500 bg-red-500/10" : "border-slate-700 text-slate-500"
                      }`}>
                        {remaining}
                      </div>
                  </div>
                </div>

                {/* Media Generation Area */}
                <div className="p-6 rounded-[2rem] bg-slate-900/30 border-2 border-dashed border-slate-800 hover:border-slate-700 transition-all group">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                         <ImagePlus size={16} className="text-slate-500" />
                         <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Generative Media</span>
                      </div>
                      {aiImageGenerating && <div className="h-3 w-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
                   </div>
                   <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={aiImagePrompt}
                        onChange={e => setAiImagePrompt(e.target.value)}
                        placeholder="Describe a scene to manifest..."
                        className="flex-1 bg-slate-900/50 border-none text-xs font-bold text-slate-300 p-3 rounded-xl focus:ring-1 focus:ring-primary/50 outline-none" 
                      />
                      <button type="button" onClick={handleAiImage} disabled={aiImageGenerating || !aiImagePrompt}
                        className="bg-slate-800 p-3 rounded-xl hover:bg-slate-700 transition-all text-slate-400 hover:text-white disabled:opacity-20">
                        <Wand2 size={16} />
                      </button>
                   </div>
                </div>

                {/* Timing Selector */}
                <div className="space-y-4">
                   <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: "now", label: "Instant", icon: Zap },
                      { value: "schedule", label: "Schedule", icon: Clock },
                      { value: "draft", label: "Draft", icon: FileEdit },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value} type="button"
                        onClick={() => setPostType(value)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 transition-all duration-300 ${
                          postType === value 
                            ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" 
                            : "bg-slate-900/30 border-slate-800 text-slate-500 hover:border-slate-700"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
                      </button>
                    ))}
                  </div>

                  {postType === "schedule" && (
                    <div className="animate-slide-up p-5 rounded-3xl bg-slate-900/50 border-2 border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] uppercase font-black text-slate-500">Publication Time</label>
                         <button type="button" onClick={handleSuggestTime} className="flex items-center gap-1.5 text-primary text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors">
                            <Sparkles size={10} /> Optimize for Peak
                         </button>
                      </div>
                       <input 
                        type="datetime-local" 
                        value={scheduledFor} 
                        onChange={e => setScheduledFor(e.target.value)}
                        required 
                        className="w-full bg-slate-800 border-none text-white p-3 rounded-xl focus:ring-2 focus:ring-primary text-sm" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-8 border-t border-slate-800 bg-[#0F172A]/80 backdrop-blur-xl">
               {errorMsg && (
                <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-bounce-in">
                  <CheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
                </div>
              )}

              <Button 
                type="submit" 
                size="lg"
                className="w-full rounded-[2rem] h-14 text-base font-bold gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50" 
                disabled={!content.trim() || !platform || submitting || remaining < 0}
                style={{ 
                  backgroundColor: cfg?.color || undefined, 
                  boxShadow: cfg ? `0 12px 30px -10px ${cfg.color}66` : undefined 
                }}>
                {submitting ? (
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {postType === "now" ? <Send className="h-5 w-5" /> : postType === "schedule" ? <Clock className="h-5 w-5" /> : <FileEdit className="h-5 w-5" />}
                    {postType === "now" ? `Publish to ${cfg?.label}` : postType === "schedule" ? "Schedule Publication" : "Save as Draft"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* RIGHT — Premium Queue */}
      <div className="flex-1 flex flex-col overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="p-8 border-b border-border bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Content Queue</h2>
              <p className="text-sm text-muted-foreground font-medium">Manage your content timeline efficiently</p>
            </div>
            
            <div className="flex p-1 bg-muted rounded-2xl w-fit">
              {(["all", "draft", "scheduled", "published", "failed"] as FilterTab[]).map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${
                    activeFilter === f 
                      ? "bg-white shadow-lg text-foreground scale-105" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {f} {filterCounts[f] > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-muted text-[10px] opacity-60 font-black">{filterCounts[f]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
          <div className="max-w-4xl mx-auto space-y-6 stagger-children">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-40 bg-white border border-border rounded-[2.5rem] animate-shimmer" />
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-24 w-24 rounded-[2.5rem] bg-white border border-border shadow-sm flex items-center justify-center mb-8 animate-float">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Queue is empty</h3>
                <p className="text-muted-foreground max-w-sm font-medium">
                  {activeFilter === "all" 
                    ? "Time to fill your calendar with some amazing content! Start using the composer on the left." 
                    : `No ${activeFilter} posts found in your library.`}
                </p>
              </div>
            ) : filteredPosts.map((post, i) => {
              const pcfg = PLATFORM_CONFIG[post.platform]
              const PIcon = pcfg?.Icon || Globe
              return (
                <div key={post.id}
                  className="group relative bg-white border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    post.status === "published" ? "bg-emerald-500" :
                    post.status === "scheduled" ? "bg-blue-500" :
                    post.status === "failed" ? "bg-red-500" : "bg-slate-300"
                  }`} />

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1 min-w-0 flex gap-6">
                       <div className="p-4 rounded-3xl bg-slate-50 group-hover:bg-white border border-border transition-all duration-500 h-fit">
                        <PIcon size={28} color={pcfg?.color} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-widest" style={{ color: pcfg?.color }}>{pcfg?.label || post.platform}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full ${
                             post.status === "published" ? "bg-emerald-50 text-emerald-600" :
                             post.status === "scheduled" ? "bg-blue-50 text-blue-600" :
                             post.status === "failed" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                          }`}>{post.status}</span>
                        </div>
                        <p className="text-base font-medium leading-relaxed text-slate-700 line-clamp-4 group-hover:text-slate-900 transition-colors">{post.content}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-6 h-full justify-between min-w-[140px]">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           {post.status === "published" ? "Published on" : post.status === "scheduled" ? "Set for" : "Created"}
                        </span>
                        <div className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-border/50">
                           {post.scheduledFor || post.publishedAt
                            ? new Date(post.scheduledFor || post.publishedAt!).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Button size="icon" variant="outline" className="h-10 w-10 rounded-2xl hover:bg-slate-50"
                           onClick={() => { setContent(post.content); setPlatform(post.platform); textareaRef.current?.focus() }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-10 w-10 rounded-2xl text-destructive hover:bg-red-50 hover:border-red-200"
                           onClick={() => handleDelete(post.id)} disabled={deleting === post.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {(post.status === "draft" || post.status === "failed" || post.status === "scheduled") && (
                          <Button size="icon" className="h-10 w-10 rounded-2xl shadow-lg shadow-primary/20"
                             onClick={() => handlePublish(post)} disabled={publishing === post.id}
                             style={{ backgroundColor: pcfg?.color }}>
                            <Zap className="h-4 w-4 fill-white text-white" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ========== CORTEX COPILOT MODAL ========== */}
      {showAiModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#0F172A]/90 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col md:flex-row">
              <div className="w-full md:w-[240px] bg-[#0F172A] p-10 text-white relative flex flex-col justify-between overflow-hidden">
                 <div className="relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
                       <Brain className="h-6 w-6" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter leading-tight">Cortex Copilot</h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-3">Advanced Generation</p>
                    <p className="text-xs text-slate-400 mt-6 leading-relaxed font-medium">Use natural language to draft high-engagement variants of your post.</p>
                 </div>
                 <Cpu className="absolute -right-8 -bottom-8 h-40 w-40 text-white/5 -rotate-12" />
              </div>

              <div className="flex-1 p-10 bg-slate-50/50 flex flex-col gap-8">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration</span>
                    <button type="button" onClick={() => setShowAiModal(false)} className="h-8 w-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all text-slate-400 hover:text-slate-900">
                       <X size={16} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Topic / Topic Brief</label>
                       <textarea 
                         value={aiBrief} onChange={e => setAiBrief(e.target.value)}
                         placeholder="e.g. Announcing our new eco-friendly product launch with a focus on sustainability..."
                         className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold resize-none h-24 focus:border-indigo-400 outline-none transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tone Settings</label>
                          <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none cursor-pointer appearance-none">
                             <option value="Professional">Professional</option>
                             <option value="Witty">Witty/Humorous</option>
                             <option value="Exciting">Exciting/Hype</option>
                             <option value="Empathetic">Empathetic</option>
                          </select>
                       </div>
                       <Button onClick={handleAiDraft} disabled={aiGenerating || !aiBrief} size="lg" className="self-end rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] gap-3">
                          {aiGenerating ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap size={14} /> Manifest</>}
                       </Button>
                    </div>
                 </div>

                 {aiVariants.length > 0 && (
                   <div className="space-y-4 animate-slide-up">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated Variants</span>
                      <div className="space-y-3">
                         {aiVariants.map((v, i) => (
                            <button 
                              key={i} type="button" onClick={() => { setContent(v); setShowAiModal(false); }}
                              className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all text-xs font-medium leading-relaxed group"
                            >
                               <span className="block text-slate-700 group-hover:text-indigo-700">{v}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
