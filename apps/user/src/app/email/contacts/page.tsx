"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../components/auth-provider"
import { api } from "../../../lib/api"
import { Button } from "@repo/ui"
import { 
  Plus, Trash2, Tag, Mail, Users, Search, 
  UserPlus, Filter, MoreHorizontal, ArrowUpRight
} from "lucide-react"

type Contact = { id: number; name: string; email: string; tags: string | null }

export default function ContactsPage() {
  const { token } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [tags, setTags] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return
    api.get<Contact[]>("/contacts", token)
      .then(setContacts).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setError("")
    try {
      const c = await api.post<Contact>("/contacts", { name, email, tags: tags || null }, token)
      setContacts(prev => [c, ...prev])
      setName(""); setEmail(""); setTags("")
    } catch (err: any) {
      setError(err.message)
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this entry from your audience?")) return
    try {
      await api.delete(`/contacts/${id}`, token)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (err: any) { setError(err.message) }
  }

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
             <Users className="h-4 w-4" />
             <span className="text-xs uppercase tracking-[0.2em]">Inventory</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Audience <span className="gradient-text">Directory</span></h1>
          <p className="text-muted-foreground text-lg">
            Manage your network of subscribers and high-value contacts.
          </p>
        </div>
        <div className="bg-white border-2 border-border/60 rounded-3xl px-6 py-4 flex items-center gap-4 shadow-xl shadow-slate-200/50">
           <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={20} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Reach</p>
              <p className="text-xl font-black tracking-tight">{contacts.length}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Registration Wing */}
        <div className="lg:col-span-1 space-y-6 animate-slide-in-left">
          <div className="bg-white border-2 border-border shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-8 sticky top-8">
            <div>
              <h2 className="text-xl font-black tracking-tight mb-1">New Entry</h2>
              <p className="text-xs text-muted-foreground font-medium">Add a subscriber to your database.</p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold animate-shake">
                 {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
                 <input
                  type="text" placeholder="John Doe" value={name} required
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:border-primary/30 focus:bg-white outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Protocol</label>
                 <input
                  type="email" placeholder="john@example.com" value={email} required
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:border-primary/30 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Segment Tags</label>
                 <input
                  type="text" placeholder="tech, vip, early-adopter"
                  value={tags} onChange={e => setTags(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:border-primary/30 focus:bg-white outline-none transition-all"
                />
              </div>

              <Button type="submit" disabled={submitting} size="lg" className="w-full rounded-2xl h-14 font-black uppercase tracking-[0.15em] text-xs gap-3 shadow-lg shadow-primary/20">
                {submitting ? "Processing..." : <><Plus size={18} /> Register Contact</>}
              </Button>
            </form>
          </div>
        </div>

        {/* Database Wing */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border-2 border-border shadow-xl shadow-slate-200/30 rounded-[3rem] overflow-hidden flex flex-col min-h-[600px] animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="px-10 py-8 border-b border-border bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text" placeholder="Locate by name or email..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium focus:border-primary outline-none transition-all"
                  />
               </div>
               <div className="flex gap-3">
                  <Button variant="outline" className="rounded-xl h-12 px-5 gap-2 font-bold text-xs uppercase tracking-widest border-2">
                     <Filter size={16} /> Filter
                  </Button>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-10 py-6 border-b border-border font-black">Identity</th>
                    <th className="px-10 py-6 border-b border-border font-black">Architecture</th>
                    <th className="px-10 py-6 border-b border-border font-black">Segments</th>
                    <th className="px-10 py-6 border-b border-border font-black text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-shimmer">
                        <td colSpan={4} className="px-10 py-8"><div className="h-6 bg-slate-100 rounded-xl" /></td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-32 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30 grayscale mb-6">
                           <Users size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 tracking-tight">Zero Matches</h3>
                        <p className="text-sm text-slate-300 font-medium">Your search query did not yield any results.</p>
                      </td>
                    </tr>
                  ) : filtered.map((c, i) => (
                    <tr key={c.id} 
                      className="group hover:bg-slate-50/80 transition-all duration-300 cursor-default"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 rounded-[1.25rem] bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 font-black text-xs">
                              {c.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-black tracking-tight text-slate-800">{c.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscriber</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <a href={`mailto:${c.email}`} className="text-sm font-bold text-slate-500 hover:text-primary flex items-center gap-2 transition-colors">
                          <Mail className="h-4 w-4 opacity-30" /> {c.email}
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-wrap gap-2">
                          {c.tags ? c.tags.split(",").map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <Tag className="h-3 w-3" /> {tag.trim()}
                            </span>
                          )) : <span className="text-[10px] text-slate-300 font-bold italic">No tags</span>}
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => handleDelete(c.id)} className="p-3 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                              <Trash2 size={16} />
                           </button>
                           <button className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all">
                              <MoreHorizontal size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {!loading && filtered.length > 0 && (
              <div className="px-10 py-6 border-t border-border bg-slate-50/30 flex items-center justify-between">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Listing {filtered.length} entries</p>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-10 rounded-xl px-4 font-black">Previous</Button>
                    <Button variant="ghost" size="sm" className="h-10 rounded-xl px-4 font-black text-primary">Next</Button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
