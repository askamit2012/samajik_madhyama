"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { 
  Zap, Settings, Shield, CreditCard, Cpu, 
  CheckCircle2, AlertCircle, ChevronRight,
  Brain, Sparkles, Image as ImageIcon, MessageSquare
} from 'lucide-react'
import { Button } from '@repo/ui'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function SettingsPage() {
  const { token } = useAuth()
  const [models, setModels] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({ preferredTier: 'free', textModelId: null, imageModelId: null })
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    try {
      const [mRes, sRes] = await Promise.all([
        fetch(`${API_URL}/ai-models`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/ai-settings`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      const mData = await mRes.json()
      const sData = await sRes.json()
      
      setModels(mData)
      setSettings(sData)
    } catch (err) {
      console.error("Failed to fetch settings", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updates: any) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    setSaveStatus('Saving...')
    
    try {
      const res = await fetch(`${API_URL}/ai-settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newSettings)
      })
      
      if (res.ok) {
        setSaveStatus('Preferences synced.')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setSaveStatus('Failed to sync.')
      }
    } catch (err) {
      setSaveStatus('Network error.')
    }
  }

  if (loading) return (
    <div className="p-12 animate-pulse space-y-8">
      <div className="h-10 w-48 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64 bg-slate-50 rounded-3xl" />
        <div className="h-64 bg-slate-50 rounded-3xl" />
      </div>
    </div>
  )

  const textModels = models.filter(m => m.type === 'text' && m.isActive === 'true')
  const imageModels = models.filter(m => m.type === 'image' && m.isActive === 'true')

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-12 animate-fade-in">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
          <Settings className="h-4 w-4" />
          <span className="text-xs uppercase tracking-[0.2em]">User Profile</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Configuration <span className="gradient-text italic">Matrix</span></h1>
        <p className="text-muted-foreground text-lg">Calibrate your AI experience and tier preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 space-y-8 animate-slide-in-left">
              <div>
                 <h2 className="text-xl font-black tracking-tight mb-2">Operational Tier</h2>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Choose your intelligence depth</p>
              </div>

              <div className="space-y-4">
                 {[
                   { id: 'free', label: 'Community', desc: 'Standard AI models with automatic failover.', icon: Brain, color: 'indigo' },
                   { id: 'paid', label: 'Premium', desc: 'High-performance dedicated models for elite content.', icon: Sparkles, color: 'amber' }
                 ].map(tier => (
                    <button 
                      key={tier.id}
                      onClick={() => handleSave({ preferredTier: tier.id })}
                      className={`w-full p-5 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${
                        settings.preferredTier === tier.id 
                          ? `border-${tier.id === 'paid' ? 'amber' : 'indigo'}-400 bg-${tier.id === 'paid' ? 'amber' : 'indigo'}-50 shadow-lg shadow-${tier.id === 'paid' ? 'amber' : 'indigo'}-500/10` 
                          : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                       <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                         settings.preferredTier === tier.id ? `bg-${tier.id === 'paid' ? 'amber' : 'indigo'}-500 text-white` : 'bg-slate-200 text-slate-400'
                       }`}>
                          <tier.icon size={20} />
                       </div>
                       <div>
                          <p className={`text-sm font-black ${settings.preferredTier === tier.id ? `text-${tier.id === 'paid' ? 'amber' : 'indigo'}-700` : 'text-slate-600'}`}>{tier.label}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1">{tier.desc}</p>
                       </div>
                       {settings.preferredTier === tier.id && <CheckCircle2 className={`ml-auto h-5 w-5 text-${tier.id === 'paid' ? 'amber' : 'indigo'}-500`} />}
                    </button>
                 ))}
              </div>

              {saveStatus && (
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 animate-pulse">
                   <Zap size={14} /> {saveStatus}
                </div>
              )}
           </div>

           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-black tracking-tight mb-2">Auto-Failover Active</h3>
                <p className="text-xs text-indigo-100 leading-relaxed font-medium">
                  Our intelligent orchestrator will automatically switch to the next available agent in your tier if limits are reached.
                </p>
              </div>
              <Cpu className="absolute -right-8 -bottom-8 h-32 w-32 text-white/10 -rotate-12" />
           </div>
        </div>

        <div className="lg:col-span-2 space-y-12 animate-slide-up">
           <div className="bg-white border-2 border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/40 space-y-10">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Brain size={28} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black tracking-tight">Agent Selection</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pin your favorite cognitive engines</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {/* Text Model Selection */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <MessageSquare size={16} className="text-slate-400" />
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Post Copywriter</label>
                    </div>
                    <div className="space-y-3">
                       {textModels.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => handleSave({ textModelId: m.id })}
                            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                              settings.textModelId === m.id ? 'border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/5' : 'border-slate-50 bg-slate-50 hover:border-slate-100'
                            }`}
                          >
                             <div className="flex items-center gap-3">
                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${m.tier === 'paid' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                   {m.tier}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{m.name}</span>
                             </div>
                             {settings.textModelId === m.id && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Image Model Selection */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <ImageIcon size={16} className="text-slate-400" />
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visual Generator</label>
                    </div>
                    <div className="space-y-3">
                       {imageModels.map(m => (
                          <button 
                            key={m.id}
                            onClick={() => handleSave({ imageModelId: m.id })}
                            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                              settings.imageModelId === m.id ? 'border-indigo-400 bg-indigo-50/50 shadow-md shadow-indigo-500/5' : 'border-slate-50 bg-slate-50 hover:border-slate-100'
                            }`}
                          >
                             <div className="flex items-center gap-3">
                                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${m.tier === 'paid' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                   {m.tier}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{m.name}</span>
                             </div>
                             {settings.imageModelId === m.id && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-start gap-4">
                 <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-amber-500" />
                 </div>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Selections here act as "Preferred Agents". If a preferred agent is unresponsive or over-limit, the system will seamlessly transition to the next best match.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
