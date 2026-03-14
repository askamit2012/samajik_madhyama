"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../components/auth-provider"
import { api } from "../../../lib/api"
import { Button } from "@repo/ui"
import { 
  Plus, Edit2, Trash2, FileText, X, 
  Code2, Eye, Layout, Save, ChevronLeft,
  Search, Terminal, AlertCircle, Zap, Brain, Sparkles
} from "lucide-react"

type Template = { id: number; name: string; subject: string; htmlContent: string; plainText: string | null }

export default function TemplatesPage() {
  const { token } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Template | null>(null)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [htmlContent, setHtmlContent] = useState("")
  const [plainText, setPlainText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  // AI Assistant State
  const [showAiAssistant, setShowAiAssistant] = useState(false)
  const [aiGoal, setAiGoal] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get<Template[]>("/templates", token)
      .then(setTemplates).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const startNew = () => { setEditing(null); setName(""); setSubject(""); setHtmlContent(""); setPlainText(""); setError("") }
  const startEdit = (t: Template) => { setEditing(t); setName(t.name); setSubject(t.subject); setHtmlContent(t.htmlContent); setPlainText(t.plainText || "") }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError("")
    try {
      const payload = { name, subject, htmlContent, plainText: plainText || null }
      if (editing) {
        const updated = await api.put<Template>(`/templates/${editing.id}`, payload, token)
        setTemplates(prev => prev.map(t => t.id === editing.id ? updated : t))
      } else {
        const created = await api.post<Template>("/templates", payload, token)
        setTemplates(prev => [created, ...prev])
        setEditing(created)
      }
    } catch (err: any) { setError(err.message) } finally { setSubmitting(false) }
  }

  const handleAiDraft = async () => {
    if (!aiGoal) return
    setAiGenerating(true)
    try {
      const data = await api.post<{ subject: string, htmlBody: string }>("/ai/draft-email", { goal: aiGoal }, token)
      setSubject(data.subject)
      setHtmlContent(data.htmlBody)
      setShowAiAssistant(false)
    } catch (err: any) {
      setError(err.message || "AI failed to respond")
    } finally {
      setAiGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Destroy this blueprint? This action is irreversible.")) return
    try {
      await api.delete(`/templates/${id}`, token)
      setTemplates(prev => prev.filter(t => t.id !== id))
      if (editing?.id === id) startNew()
    } catch (err: any) { setError(err.message) }
  }

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar: Digital Archive */}
      <div className="w-[340px] shrink-0 flex flex-col bg-[#0F172A] border-r border-slate-800 animate-slide-in-left">
        <div className="p-8 border-b border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-bold">
               <Layout className="h-4 w-4" />
               <span className="text-xs uppercase tracking-[0.2em]">Studio</span>
            </div>
            <button onClick={startNew}
              className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="relative group">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
             <input 
               type="text" placeholder="Search blueprints..." value={search} onChange={e => setSearch(e.target.value)}
               className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-300 outline-none focus:border-primary/50 transition-all font-medium"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3 stagger-children">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-900/50 rounded-2xl animate-shimmer" />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-700 mb-4">
                 <FileText size={24} />
              </div>
              <p className="text-sm text-slate-500 font-bold tracking-tight">Archive Empty</p>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">No blueprints found</p>
            </div>
          ) : (
            filtered.map(t => (
              <div key={t.id}
                onClick={() => startEdit(t)}
                className={`group p-5 rounded-2xl cursor-pointer border-2 transition-all duration-300 relative overflow-hidden ${
                  editing?.id === t.id 
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                    : "border-transparent bg-slate-900/30 hover:bg-slate-900 hover:border-slate-800"
                }`}>
                <div className="flex items-start justify-between">
                   <div className="space-y-1 max-w-[180px]">
                      <p className={`font-black tracking-tight transition-colors ${editing?.id === t.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{t.name}</p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">{t.subject}</p>
                   </div>
                   {editing?.id === t.id && (
                     <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary" />
                   )}
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                  <button onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                    className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Mainframe */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <div className="h-20 border-b border-border bg-white flex items-center justify-between px-10 shrink-0">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                 <Terminal size={18} />
              </div>
              <div>
                 <h2 className="text-lg font-black tracking-tight">{editing ? editing.name : "Uninitialized Blueprint"}</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Template Logic Engine</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <Button onClick={() => setShowAiAssistant(!showAiAssistant)} 
                variant="ghost" 
                className={`h-11 rounded-xl px-4 gap-2 font-bold text-[10px] border-2 transition-all ${showAiAssistant ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-100 text-slate-500'}`}>
                 <Sparkles size={16} className={aiGenerating ? "animate-spin" : "animate-pulse"} /> AI ASSISTANT
              </Button>
              {editing && (
                <Button variant="outline" className="h-11 rounded-xl px-6 gap-2 border-2 font-bold text-xs uppercase tracking-widest">
                   <Eye size={16} /> Preview
                </Button>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className="h-11 rounded-xl px-8 gap-2 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
                 <Save size={16} /> {submitting ? "Compiling..." : editing ? "Save Architecture" : "Deploy Blueprint"}
              </Button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
           <div className="max-w-4xl mx-auto space-y-10 animate-slide-up">
              {error && (
                <div className="p-4 rounded-[1.5rem] bg-red-50 border-2 border-red-100 text-red-600 text-xs font-bold flex items-center gap-3 animate-shake">
                   <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Blueprint Identity</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                      placeholder="e.g. Phase 1 Onboarding"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Broadcast Subject</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                      placeholder="The hook for the recipients..."
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Core HTML Payload</label>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                       <Code2 size={12} /> Standard HTML
                    </div>
                 </div>
                 <div className="relative group shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                    <textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)} required
                      className="w-full h-[400px] bg-[#1E293B] border-2 border-slate-700 rounded-[2rem] p-8 text-slate-300 font-mono text-sm leading-relaxed focus:border-primary outline-none transition-all resize-none custom-scrollbar"
                      placeholder={"<div style='font-family: sans-serif;'>\n  <h1>Welcome aboard, {{name}}!</h1>\n  <p>We're excited to have you with us.</p>\n</div>"} />
                    <div className="absolute right-6 top-6 h-8 w-8 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Layout size={14} />
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fallback Matrix <span className="text-slate-300 normal-case font-medium">(Optional)</span></label>
                 </div>
                 <textarea value={plainText} onChange={e => setPlainText(e.target.value)}
                   className="w-full h-32 bg-white border-2 border-slate-200 rounded-[1.5rem] p-6 text-sm font-medium focus:border-primary outline-none transition-all resize-none"
                   placeholder="Simple text version for older mail clients..." />
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-8 flex items-start gap-6 text-slate-300">
                 <div className="h-12 w-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-primary shrink-0 shadow-lg">
                    <Zap size={20} />
                 </div>
                 <div className="space-y-1">
                    <p className="font-black tracking-tight text-white">Dynamic Parameter Injection</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                       Use <code className="text-primary font-mono">&#123;&#123;name&#125;&#125;</code> and <code className="text-primary font-mono">&#123;&#123;email&#125;&#125;</code> to personalize your broadcast for each individual subscriber in your directory.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* AI SIDEBAR */}
      {showAiAssistant && (
        <div className="w-[360px] shrink-0 bg-white border-l border-border flex flex-col animate-slide-in-right shadow-2xl">
           <div className="p-8 border-b border-border space-y-2">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2 text-primary font-bold">
                    <Brain className="h-5 w-5" />
                    <span className="text-xs uppercase tracking-widest">Cortex Assistant</span>
                 </div>
                 <button onClick={() => setShowAiAssistant(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <X size={18} />
                 </button>
              </div>
              <h3 className="text-lg font-black tracking-tight">Campaign Manifest</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Describe your broadcast intent</p>
           </div>

           <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generation Goal</label>
                 <textarea 
                   value={aiGoal} onChange={e => setAiGoal(e.target.value)}
                   placeholder="e.g. A welcome email for new members with a 15% discount code..."
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold resize-none h-40 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                 />
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border-2 border-indigo-100 text-indigo-600 space-y-3">
                 <div className="flex items-center gap-2">
                    <Zap size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Model Payload</span>
                 </div>
                 <p className="text-xs leading-relaxed font-semibold opacity-80">
                    Our engine will generate a semantic subject line and a structured HTML body with industry-standard patterns.
                 </p>
              </div>

              <Button onClick={handleAiDraft} disabled={aiGenerating || !aiGoal} size="lg" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/10 transition-all active:scale-95">
                 {aiGenerating ? <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles size={18} /> Manifest Blueprint</>}
              </Button>
           </div>

           <div className="p-8 border-t border-border bg-slate-50/50">
              <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed italic">
                 All generated blueprints include standard <code className="text-indigo-500 normal-case">&#123;&#123;name&#125;&#125;</code> tags for dynamic personalization.
              </p>
           </div>
        </div>
      )}
    </div>
  )
}
