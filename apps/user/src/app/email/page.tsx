"use client"

import Link from "next/link"
import { Button } from "@repo/ui"
import { 
  Mail, Users, FileText, Send, Zap, ChevronRight, 
  ArrowUpRight, BarChart3, PlusCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { useAuth } from "../../components/auth-provider"

export default function EmailDashboardPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    contacts: 0,
    templates: 0,
    campaigns: 0,
    sent: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    Promise.all([
      api.get<any[]>("/contacts", token),
      api.get<any[]>("/templates", token),
      api.get<any[]>("/campaigns", token),
    ]).then(([cs, ts, cams]) => {
      setStats({
        contacts: Array.isArray(cs) ? cs.length : 0,
        templates: Array.isArray(ts) ? ts.length : 0,
        campaigns: Array.isArray(cams) ? cams.length : 0,
        sent: Array.isArray(cams) ? cams.filter(c => c.status === "sent" || c.status === "completed").length : 0
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [token])

  const menuItems = [
    {
      title: "Audience Control",
      desc: "Manage your subscriber lists, add segments, and track engagement.",
      icon: Users,
      href: "/email/contacts",
      color: "bg-blue-500",
      stats: `${stats.contacts} Total Contacts`,
      action: "Manage Contacts"
    },
    {
      title: "Template Studio",
      desc: "Craft high-converting, responsive email templates with our editor.",
      icon: FileText,
      href: "/email/templates",
      color: "bg-violet-500",
      stats: `${stats.templates} active designs`,
      action: "Open Studio"
    },
    {
      title: "Campaign Forge",
      desc: "Deploy bulk campaigns, schedule delivery, and analyze reach.",
      icon: Send,
      href: "/email/campaigns",
      color: "bg-emerald-500",
      stats: `${stats.campaigns} total launches`,
      action: "Launch Now"
    }
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <Mail className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">Email Hub</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Campaign <span className="gradient-text">Operations</span></h1>
          <p className="text-muted-foreground text-lg">
            Build authority and trust with precision-targeted email communications.
          </p>
        </div>
        <div className="flex gap-3">
           <Link href="/email/campaigns/new">
             <Button className="rounded-2xl h-12 px-6 gap-2 shadow-lg shadow-primary/20">
                <PlusCircle className="h-4 w-4" /> New Campaign
             </Button>
           </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        {[
          { label: "Total Audience", value: stats.contacts, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Active Designs", value: stats.templates, icon: FileText, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "Sent Campaigns", value: stats.sent, icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Delivery Rate", value: "98.2%", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-500/10" },
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

      {/* Component Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {menuItems.map((item, i) => (
          <Link href={item.href} key={i}>
            <div className="group relative p-8 bg-white border border-border rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col cursor-pointer overflow-hidden">
               {/* Background Glow */}
               <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full ${item.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 blur-3xl`} />
               
               <div className="mb-8 flex items-center justify-between">
                  <div className={`h-14 w-14 rounded-3xl ${item.color} text-white flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500`}>
                     <item.icon size={26} />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-primary transition-colors">
                     {item.stats}
                  </div>
               </div>

               <h2 className="text-2xl font-black tracking-tight mb-3 text-slate-800">{item.title}</h2>
               <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-8 flex-grow">
                  {item.desc}
               </p>

               <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">
                  {item.action}
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Global Notice */}
      <div className="glass rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 justify-between animate-slide-up" style={{ animationDelay: '600ms' }}>
         <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold tracking-tight">Ready to double your conversion?</h3>
            <p className="text-sm text-muted-foreground font-medium max-w-xl">
               Create personalized template variations for different segments and track which one performs better in real-time.
            </p>
         </div>
         <Link href="/email/templates">
            <Button size="lg" variant="outline" className="rounded-2xl px-8 h-12 font-bold uppercase tracking-widest text-xs border-2">
               Explore Studio
            </Button>
         </Link>
      </div>
    </div>
  )
}
