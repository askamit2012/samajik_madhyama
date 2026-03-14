"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../components/auth-provider"
import { api } from "../../../lib/api"
import { Button } from "@repo/ui"
import {
  Send, CheckCircle, Plus, AlertCircle,
  Mail, FileText, BarChart3, Zap
} from "lucide-react"

interface Template { id: number; name: string; subject: string }
interface Contact { id: number; name: string; email: string }
interface Campaign { id: number; name: string; subject: string; status: string; createdAt: string; sentAt: string | null }

export default function CampaignsPage() {
  const { token } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [selected, setSelected] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<Template[]>("/templates", token),
      api.get<Contact[]>("/contacts", token),
      api.get<Campaign[]>("/campaigns", token),
    ]).then(([t, c, cam]) => {
      setTemplates(Array.isArray(t) ? t : [])
      setContacts(Array.isArray(c) ? c : [])
      setCampaigns(Array.isArray(cam) ? (cam as Campaign[]).reverse() : [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); setError(""); setSuccess("")
    try {
      await api.post<{ campaignId: number }>("/campaigns/send", {
        name, subject, templateId: parseInt(templateId), contactIds: selected
      }, token)
      setSuccess(`Success! Campaign "${name}" is being deployed.`)
      setName(""); setSubject(""); setTemplateId(""); setSelected([])
      const updated = await api.get<Campaign[]>("/campaigns", token)
      setCampaigns(Array.isArray(updated) ? (updated as Campaign[]).reverse() : [])
      setTimeout(() => setSuccess(""), 5000)
    } catch (err: any) { setError(err.message) } finally { setSending(false) }
  }

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const onTemplateChange = (id: string) => {
    setTemplateId(id)
    const tpl = templates.find(t => t.id === parseInt(id))
    if (tpl && !subject) setSubject(tpl.subject)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      {/* LEFT — Campaign Forge */}
      <div className="w-full lg:w-[480px] shrink-0 flex flex-col bg-[#0F172A] text-slate-300 border-r border-slate-800 animate-slide-in-left">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
             <Zap className="h-4 w-4 fill-primary" />
             <span className="text-xs uppercase tracking-[0.2em]">Forge</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Campaign Creator</h1>
          <p className="text-sm text-slate-500 mt-2">Initialize your next high-impact email sequence.</p>
        </div>

        <form onSubmit={handleSend} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 stagger-children">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-bounce-in">
                <CheckCircle className="h-4 w-4 shrink-0" /> {success}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1">Campaign Identifier</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Internal campaign name..."
                  className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1">Design Template</label>
                <select value={templateId} onChange={e => onTemplateChange(e.target.value)} required
                  className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-4 text-white focus:border-primary/50 outline-none appearance-none cursor-pointer">
                  <option value="" className="bg-slate-900">Choose a template...</option>
                  {templates.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1">Email Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                  placeholder="Inbox subject line..."
                  className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-4 text-white focus:border-primary/50 outline-none transition-all" />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1 flex justify-between">
                  Audience Selection
                  <span className="text-primary">{selected.length} Selected</span>
                </label>
                <div className="bg-slate-900/50 border-2 border-slate-800 rounded-[2rem] overflow-hidden">
                   <div className="max-h-[220px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/50">
                     {contacts.length === 0 ? (
                       <div className="p-8 text-center text-slate-600 text-sm italic">Inventory empty. Add contacts first.</div>
                     ) : (
                       contacts.map(c => (
                         <label key={c.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 cursor-pointer transition-colors ${selected.includes(c.id) ? 'bg-primary/5' : ''}`}>
                           <div className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${selected.includes(c.id) ? 'bg-primary border-primary' : 'border-slate-700'}`}>
                              {selected.includes(c.id) && <CheckCircle className="h-3 w-3 text-white" />}
                           </div>
                           <input type="checkbox" className="hidden" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                           <div>
                             <p className="text-sm font-bold text-slate-200">{c.name}</p>
                             <p className="text-[10px] text-slate-500 font-medium">{c.email}</p>
                           </div>
                         </label>
                       ))
                     )}
                   </div>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-[2rem] h-14 text-sm font-black uppercase tracking-[0.15em] gap-3 shadow-2xl shadow-primary/20 active:scale-95 transition-all"
              disabled={sending || selected.length === 0 || !templateId}>
              {sending ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="h-5 w-5" /> Deploy Fleet</>}
            </Button>
        </form>
      </div>

      {/* RIGHT — Deployment History */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
        <div className="p-8 border-b border-border bg-white/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Deployment Log</h2>
            <p className="text-sm text-muted-foreground font-medium">Monitoring your outreach infrastructure</p>
          </div>
          <div className="h-12 w-12 rounded-[1.25rem] bg-white border border-border shadow-sm flex items-center justify-center text-slate-400">
             <BarChart3 size={20} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
           <div className="max-w-4xl mx-auto space-y-6 stagger-children">
             {loading ? (
               Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="h-32 bg-white border border-border rounded-[2.5rem] animate-shimmer" />
               ))
             ) : campaigns.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-24 w-24 rounded-[2.5rem] bg-white border border-border shadow-sm flex items-center justify-center mb-8 animate-float text-slate-200">
                    <Mail size={40} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Silent Broadcasts</h3>
                  <p className="text-muted-foreground max-w-sm mt-2 font-medium">No campaign history detected. Use the forge on the left to start communicating.</p>
               </div>
             ) : (
               campaigns.map((c, i) => (
                 <div key={c.id} 
                   className="group relative bg-white border border-border rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                   style={{ animationDelay: `${i * 50}ms` }}
                 >
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                      c.status === "completed" || c.status === "sent" ? "bg-emerald-500" :
                      c.status === "sending" ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                    }`} />

                    <div className="flex items-start justify-between gap-6">
                       <div className="flex gap-6">
                          <div className="h-14 w-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                             <Mail size={24} />
                          </div>
                          <div className="space-y-2">
                             <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black tracking-tight">{c.name}</h3>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                  c.status === "completed" || c.status === "sent" ? "bg-emerald-50 text-emerald-600" :
                                  c.status === "sending" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                                }`}>{c.status}</span>
                             </div>
                             <p className="text-sm font-bold text-slate-500 line-clamp-1">{c.subject}</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initialization</span>
                          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-800">
                             {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                       </div>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  )
}
