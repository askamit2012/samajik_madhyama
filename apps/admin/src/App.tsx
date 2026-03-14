"use client"

import { useState, useEffect } from 'react'
import { Button } from '@repo/ui'
import { 
  LayoutDashboard, Users, Key, LogOut, Menu, X, 
  Zap, Shield, Server, ArrowUpRight, CheckCircle, 
  AlertCircle, ChevronRight, Settings, Info,
  Facebook, Instagram, Linkedin, Twitter, Globe,
  ShieldAlert, Lock, UserPlus, Fingerprint, Database,
  Search, Cpu, Activity, Save, FileText, Eye
} from 'lucide-react'
import { api } from './lib/api'

const PLATFORMS = ["facebook", "instagram", "linkedin", "twitter", "google"]

const PLATFORM_INFO: Record<string, { label: string; color: string; icon: any; scopes: string; note?: string }> = {
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    icon: Facebook,
    scopes: "pages_show_list, pages_manage_posts",
    note: "Requires a Facebook App in Business Manager with Pages permissions."
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    icon: Instagram,
    scopes: "user_profile, user_media",
    note: "Uses separate Instagram Basic Display API app credentials."
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0077B5",
    icon: Linkedin,
    scopes: "r_liteprofile, w_member_social",
  },
  twitter: {
    label: "Twitter / X",
    color: "#000000",
    icon: Twitter,
    scopes: "tweet.read, tweet.write, users.read",
    note: "Twitter requires OAuth 2.0 with PKCE enabled."
  },
  google: {
    label: "Google (Ads)",
    color: "#DB4437",
    icon: Globe,
    scopes: "adwords, userinfo.profile",
    note: "Used for Google Ads campaigns management."
  },
}

type Credential = {
  id?: number
  platform: string
  appId: string
  appSecret: string
}

type User = {
  id: number
  name: string
  email: string
  role: string
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"))
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Auth Forms
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")

  // Layout State
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "credentials" | "admins" | "ai">("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Credentials State
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0])
  const [appId, setAppId] = useState("")
  const [appSecret, setAppSecret] = useState("")
  const [saveStatus, setSaveStatus] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Admin Users State
  const [admins, setAdmins] = useState<User[]>([])
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [newAdminRole, setNewAdminRole] = useState("admin")
  const [adminSaveStatus, setAdminSaveStatus] = useState("")

  // AI Models State
  const [aiModels, setAiModels] = useState<any[]>([])
  const [newModelName, setNewModelName] = useState("")
  const [newModelProvider, setNewModelProvider] = useState("gemini")
  const [newModelTier, setNewModelTier] = useState("free")
  const [newModelType, setNewModelType] = useState("text")
  const [modelSaveStatus, setModelSaveStatus] = useState("")

  useEffect(() => {
    if (token) fetchMe(token)
    else setAuthLoading(false)
  }, [token])

  useEffect(() => {
    if (user) {
      fetchCredentials()
      if (user.role === "superadmin") {
        fetchAdmins()
        fetchAiModels()
      }
    }
  }, [user, token])

  useEffect(() => {
    const cred = credentials.find(c => c.platform === selectedPlatform)
    if (cred) {
      setAppId(cred.appId)
      setAppSecret(cred.appSecret)
    } else {
      setAppId("")
      setAppSecret("")
    }
    setSaveStatus("")
  }, [selectedPlatform, credentials])

  // --- AUTHENTICATION ---
  const fetchMe = async (authToken: string) => {
    try {
      const data = await api.get<{user: User}>("/auth/me", authToken)
      if (data.user.role === "admin" || data.user.role === "superadmin") {
        setUser(data.user)
      } else handleLogout()
    } catch { handleLogout() } 
    finally { setAuthLoading(false) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    try {
      const data = await api.post<{token: string, user: User}>("/auth/login", { email, password })
      if (data.user.role === "admin" || data.user.role === "superadmin") {
        localStorage.setItem("admin_token", data.token)
        setToken(data.token)
        setUser(data.user)
      } else setAuthError("Unauthorized: Admins only.")
    } catch (err: any) { setAuthError(err.message || "Login failed") }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    setToken(null)
    setUser(null)
  }

  // --- CREDENTIALS API ---
  const fetchCredentials = async () => {
    try {
      setCredentials(await api.get<Credential[]>("/platform-credentials", token))
    } catch(e) { console.error(e) }
  }

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveStatus("")
    try {
      await api.post("/platform-credentials", { platform: selectedPlatform, appId, appSecret }, token)
      setSaveStatus("Success: Credentials updated.")
      fetchCredentials()
    } catch(e: any) { setSaveStatus(`Error: ${e.message}`) }
    finally { setIsSaving(false) }
  }

  // --- ADMINS API ---
  const fetchAdmins = async () => {
    try {
      setAdmins(await api.get<User[]>("/admin-users", token))
    } catch(e) { console.error(e) }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminSaveStatus("Synchronizing...")
    try {
      await api.post("/admin-users", { name: newAdminName, email: newAdminEmail, password: newAdminPassword, role: newAdminRole }, token)
      setAdminSaveStatus("Success: Admin profile created.")
      setNewAdminName("")
      setNewAdminEmail("")
      setNewAdminPassword("")
      fetchAdmins()
    } catch(e: any) { setAdminSaveStatus(`Failure: ${e.message}`) }
  }

  // --- AI MODELS API ---
  const fetchAiModels = async () => {
    try {
      setAiModels(await api.get<any[]>("/ai-models", token))
    } catch(e) { console.error(e) }
  }

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault()
    setModelSaveStatus("Syncing Matrix...")
    try {
      await api.post("/ai-models", { 
        name: newModelName, 
        provider: newModelProvider, 
        tier: newModelTier, 
        type: newModelType,
        isActive: "true"
      }, token)
      setModelSaveStatus("Success: AI agent registered.")
      setNewModelName("")
      fetchAiModels()
    } catch(e: any) { setModelSaveStatus(`Error: ${e.message}`) }
  }

  if (authLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white">
      <Zap className="h-10 w-10 text-primary animate-pulse mb-4" />
      <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Initializing OS...</p>
    </div>
  )

  // ========== LOGIN SCREEN ==========
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6 animate-fade-in relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary rounded-full blur-[120px]" />
           <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10 stagger-children">
          <div className="mb-12 text-center">
             <div className="inline-flex h-16 w-16 items-center justify-center rounded-[2rem] bg-slate-900 border-2 border-slate-800 shadow-2xl mb-6">
                <Shield className="h-8 w-8 text-primary" />
             </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Admin <span className="text-primary italic">Console</span></h1>
            <p className="text-slate-500 font-medium mt-3 uppercase text-[10px] tracking-[0.2em]">Authorized Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {authError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-shake flex items-center gap-3">
                 <ShieldAlert size={16} /> {authError}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Identity Key (Email)</label>
              <div className="relative">
                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-4 pl-12 text-white placeholder:text-slate-600 focus:border-primary/50 outline-none transition-all" />
                 <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Secure Pass-Phrase</label>
              <div className="relative">
                 <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl p-4 pl-12 text-white placeholder:text-slate-600 focus:border-primary/50 outline-none transition-all" />
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-[2rem] h-14 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
               Initialize Session
            </Button>
          </form>

          <p className="text-center text-[10px] text-slate-700 font-black uppercase tracking-widest mt-12 opacity-50">
             Security Level: Ultra
          </p>
        </div>
      </div>
    )
  }

  // ========== SIDE NAVIGATION COMPONENT ==========
  const SideNav = () => (
    <div className="w-[280px] bg-[#0F172A] h-full flex flex-col border-r border-slate-800 animate-slide-in-left">
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
           <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Server size={20} />
           </div>
           <div>
              <h2 className="text-xl font-black text-white tracking-tighter">SuperUser</h2>
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">Master Control</p>
           </div>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-3">
        {[
          { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard },
          { id: 'credentials', label: 'OAuth Logic', icon: Key },
          { id: 'ai', label: 'AI Hub', icon: Zap, guard: user.role === 'superadmin' },
          { id: 'admins', label: 'Directory', icon: Users, guard: user.role === 'superadmin' }
        ].filter(i => i.guard !== false).map(item => (
          <button 
            key={item.id}
            onClick={() => { setActiveScreen(item.id as any); setMobileMenuOpen(false); }}
            className={`flex w-full items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
              activeScreen === item.id 
                ? "bg-primary text-white shadow-xl shadow-primary/20 font-bold" 
                : "text-slate-500 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <item.icon className={`h-5 w-5 ${activeScreen === item.id ? 'text-white' : 'text-slate-500 group-hover:text-primary transition-colors'}`} />
            <span className="text-sm font-black uppercase tracking-widest text-[11px]">{item.label}</span>
            {activeScreen === item.id && <ChevronRight className="ml-auto h-4 w-4" />}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800 space-y-6">
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
           <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                 <Fingerprint size={18} />
              </div>
              <div className="min-w-0">
                 <p className="text-[11px] font-black text-white truncate">{user.name}</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{user.role}</p>
              </div>
           </div>
           <Button variant="ghost" className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest gap-2" onClick={handleLogout}>
            <LogOut size={14} /> Kill Session
          </Button>
        </div>
      </div>
    </div>
  )

  // ========== MAIN DASHBOARD LAYOUT ==========
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-6 bg-[#0F172A] border-b border-slate-800 text-white">
        <h2 className="text-lg font-black tracking-tight">SuperUser OS</h2>
        <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="hidden md:block h-screen shrink-0 sticky top-0 overflow-hidden">
        <SideNav />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="w-64 h-full">
            <SideNav />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-hidden p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* ----- HOME DASHBOARD ----- */}
          {activeScreen === "dashboard" && (
            <div className="space-y-12 animate-fade-in">
               <div className="animate-slide-up">
                 <h1 className="text-4xl font-black tracking-tighter mb-2">Operational <span className="gradient-text">Pulse</span></h1>
                 <p className="text-muted-foreground text-lg font-medium">Monitoring the architectural integrity of MarketingOS.</p>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
                <div className="stat-card">
                  <div className="flex justify-between items-start mb-6">
                     <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-600">
                        <Users size={24} />
                     </div>
                     <ArrowUpRight className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="text-4xl font-black tracking-tighter">{admins.length || 1}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Active Controllers</div>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
                     <Users size={120} />
                  </div>
                </div>

                <div className="stat-card">
                   <div className="flex justify-between items-start mb-6">
                     <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-600">
                        <Database size={24} />
                     </div>
                     <Activity className="h-4 w-4 text-slate-300" />
                  </div>
                  <div className="text-4xl font-black tracking-tighter">{credentials.length}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Linked Engines</div>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
                     <Database size={120} />
                  </div>
                </div>

                <div className="stat-card border-emerald-500/20">
                   <div className="flex justify-between items-start mb-6">
                     <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <Cpu size={24} />
                     </div>
                     <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                  </div>
                  <div className="text-xl font-black tracking-tighter text-emerald-600 uppercase">Operational</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Core System Logic</div>
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
                     <Cpu size={120} />
                  </div>
                </div>
              </div>

               <div className="glass rounded-[3rem] p-12 transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] stagger-children" style={{ animationDelay: '400ms' }}>
                  <div className="flex items-center gap-4 mb-8">
                     <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                        <Settings size={20} />
                     </div>
                     <h2 className="text-2xl font-black tracking-tight">System Initialization</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="h-2 w-2 rounded-full bg-primary" />
                           <p className="text-sm font-bold text-slate-800">Database Synchronization</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                           Connected to master cluster. Heartbeat detected every 300ms. All schemas successfully migrated and healthy.
                        </p>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="h-2 w-2 rounded-full bg-blue-500" />
                           <p className="text-sm font-bold text-slate-800">OAuth Security Proxy</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                           Layer 7 encryption active for all platform handshakes. Dynamic token refreshing enabled for all user connections.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* ----- OAUTH TAB ----- */}
          {activeScreen === "credentials" && (
            <div className="animate-fade-in space-y-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
                 <div className="space-y-1">
                   <div className="flex items-center gap-2 text-primary font-bold mb-1">
                      <Key className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">Matrix</span>
                   </div>
                   <h1 className="text-4xl font-extrabold tracking-tight">Platform <span className="gradient-text">Keys</span></h1>
                   <p className="text-muted-foreground text-lg">Define universal app credentials for organizational reach.</p>
                 </div>
               </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 bg-white border-2 border-border shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-8 h-fit animate-slide-in-left">
                   <div className="flex flex-col gap-3">
                    {PLATFORMS.map(p => {
                      const info = PLATFORM_INFO[p]
                      const isConfigured = !!credentials.find(c => c.platform === p)
                      const PIcon = info?.icon || Globe
                      return (
                        <button key={p} onClick={() => setSelectedPlatform(p)}
                          className={`group text-left p-5 rounded-2xl font-black transition-all duration-300 flex items-center justify-between border-2 ${
                            selectedPlatform === p 
                              ? "bg-primary/5 text-primary border-primary/20 shadow-lg shadow-primary/5" 
                              : "bg-slate-50 border-transparent hover:border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                             <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${selectedPlatform === p ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                                <PIcon size={18} />
                             </div>
                             <span className="text-[11px] uppercase tracking-widest">{info?.label || p}</span>
                          </div>
                          {isConfigured && (
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  {(() => {
                    const info = PLATFORM_INFO[selectedPlatform]
                    const PIcon = info?.icon || Globe
                    return (
                      <div className="bg-white border-2 border-border shadow-2xl shadow-slate-200/50 rounded-[3rem] p-12 space-y-10 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 border-b border-slate-100">
                           <div className="flex items-center gap-6">
                              <div className="h-20 w-20 rounded-[2rem] text-white flex items-center justify-center shadow-2xl" style={{ backgroundColor: info?.color || "#888", boxShadow: `0 20px 40px -10px ${info?.color || '#888'}44` }}>
                                 <PIcon size={40} />
                              </div>
                              <div>
                                 <h2 className="text-3xl font-black tracking-tighter">{info?.label || selectedPlatform} Engine</h2>
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Integration Parameters</p>
                              </div>
                           </div>
                           <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${credentials.find(c => c.platform === selectedPlatform) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                              {credentials.find(c => c.platform === selectedPlatform) ? 'Active Protocol' : 'Requires Setup'}
                           </div>
                        </div>

                        {info?.note && (
                          <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-[1.5rem] text-amber-700">
                             <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Info size={18} />
                             </div>
                             <p className="text-sm font-medium leading-relaxed">{info.note}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 space-y-4">
                                 <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-slate-400" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Callback Matrix (URI)</p>
                                 </div>
                                 <div className="bg-white border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-700 flex items-center justify-between">
                                    <span className="truncate">http://localhost:4000/oauth/{selectedPlatform}/callback</span>
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400">Map this URI in the platform developer dashboard.</p>
                              </div>

                              <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 space-y-4">
                                 <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-slate-400" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Scope Layers</p>
                                 </div>
                                 <div className="flex flex-wrap gap-2">
                                    {info?.scopes.split(',').map(s => (
                                       <span key={s} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 font-mono italic">
                                          {s.trim()}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-8">
                             <form onSubmit={handleSaveCredential} className="space-y-6">
                                {saveStatus && (
                                  <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-bounce-in ${saveStatus.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                    {saveStatus.includes('Error') ? <ShieldAlert size={14} /> : <CheckCircle size={14} />}
                                    {saveStatus}
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Application ID / API Key</label>
                                  <input type="text" value={appId} onChange={e => setAppId(e.target.value)} required
                                    placeholder="Enter platform client ID..."
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Client Secret / Master Token</label>
                                  <input type="password" value={appSecret} onChange={e => setAppSecret(e.target.value)} required
                                    placeholder="••••••••••••••••••••"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                                </div>
                                <Button type="submit" size="lg" disabled={isSaving} className="w-full rounded-[1.5rem] h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/10">
                                   {isSaving ? "Synchronizing Matrix..." : <><Save size={18} /> Commit Configuration</>}
                                </Button>
                             </form>
                           </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}


          {/* ----- AI HUB TAB ----- */}
          {activeScreen === "ai" && user.role === "superadmin" && (
            <div className="animate-fade-in space-y-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
                 <div className="space-y-1">
                   <div className="flex items-center gap-2 text-primary font-bold mb-1">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">Cortex</span>
                   </div>
                   <h1 className="text-4xl font-extrabold tracking-tight">AI Agent <span className="gradient-text">Registry</span></h1>
                   <p className="text-muted-foreground text-lg">Manage the cognitive engines driving content generation.</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 animate-slide-in-left">
                     <div className="bg-white border-2 border-border shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-8 sticky top-8">
                        <div>
                           <h2 className="text-xl font-black tracking-tight mb-2">Provision Agent</h2>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Enroll New Model</p>
                        </div>

                        {modelSaveStatus && (
                          <div className={`p-4 rounded-2xl text-[10px] font-bold animate-shake ${modelSaveStatus.includes('Success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                             {modelSaveStatus}
                          </div>
                        )}

                        <form onSubmit={handleSaveModel} className="space-y-5">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Model ID (e.g. gemini-1.5-flash)</label>
                              <input type="text" value={newModelName} onChange={e => setNewModelName(e.target.value)} required
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-primary/50 transition-all" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Engine Provider</label>
                              <select value={newModelProvider} onChange={e => setNewModelProvider(e.target.value)}
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none appearance-none cursor-pointer">
                                 <option value="gemini">Google Gemini</option>
                                 <option value="openai">OpenAI (DALL-E / GPT)</option>
                                 <option value="replicate">Replicate (SDXL)</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Operational Tier</label>
                              <select value={newModelTier} onChange={e => setNewModelTier(e.target.value)}
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none appearance-none cursor-pointer">
                                 <option value="free">Free (Community)</option>
                                 <option value="paid">Premium (Enterprise)</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Output Capability</label>
                              <select value={newModelType} onChange={e => setNewModelType(e.target.value)}
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none appearance-none cursor-pointer">
                                 <option value="text">Natural Language (Text)</option>
                                 <option value="image">Generative Media (Image)</option>
                              </select>
                           </div>
                           <Button type="submit" size="lg" className="w-full rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-primary/10">
                              <Cpu size={16} /> Register Agent
                           </Button>
                        </form>
                     </div>
                  </div>

                  <div className="lg:col-span-3">
                     <div className="bg-white border-2 border-border shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <th className="px-10 py-6 border-b border-border">Agent Blueprint</th>
                                    <th className="px-10 py-6 border-b border-border">Capability</th>
                                    <th className="px-10 py-6 border-b border-border">Tier</th>
                                    <th className="px-10 py-6 border-b border-border text-right">Status</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {aiModels.length === 0 ? (
                                   <tr>
                                      <td colSpan={4} className="px-10 py-32 text-center opacity-20"><Cpu size={64} className="mx-auto" /></td>
                                   </tr>
                                 ) : aiModels.map((m, i) => (
                                    <tr key={m.id} className="group hover:bg-slate-50/50 transition-all duration-300" style={{ animationDelay: `${i * 40}ms` }}>
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-5">
                                             <div className="h-14 w-14 rounded-[1.5rem] bg-primary/5 border-2 border-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-sm">
                                                {m.type === 'text' ? <FileText size={20} /> : <Eye size={20} />}
                                             </div>
                                             <div>
                                                <p className="text-sm font-black text-slate-800 tracking-tight">{m.name}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{m.provider}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-2 bg-slate-50 border-slate-200 text-slate-600">
                                             {m.type}
                                          </span>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-2 ${
                                             m.tier === 'paid' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                          }`}>
                                             {m.tier}
                                          </span>
                                       </td>
                                       <td className="px-10 py-6 text-right">
                                          <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${m.isActive === 'true' ? 'text-emerald-500' : 'text-slate-300'}`}>
                                             <div className={`h-2 w-2 rounded-full ${m.isActive === 'true' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                             {m.isActive === 'true' ? 'Online' : 'Offline'}
                                          </div>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}


          {/* ----- ADMINS TAB ----- */}
          {activeScreen === "admins" && user.role === "superadmin" && (
            <div className="animate-fade-in space-y-12">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
                 <div className="space-y-1">
                   <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">Governance</span>
                   </div>
                   <h1 className="text-4xl font-extrabold tracking-tight">Identity <span className="gradient-text italic">Directory</span></h1>
                   <p className="text-muted-foreground text-lg">Manage the high-level operators of this infrastructure.</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1 animate-slide-in-left">
                     <div className="bg-white border-2 border-border shadow-xl shadow-slate-200/50 rounded-[2.5rem] p-8 space-y-8 sticky top-8">
                        <div>
                           <h2 className="text-xl font-black tracking-tight mb-2">New Controller</h2>
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Provision Admin Access</p>
                        </div>

                        {adminSaveStatus && (
                          <div className={`p-4 rounded-2xl text-[10px] font-bold animate-shake ${adminSaveStatus.includes('Success') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                             {adminSaveStatus}
                          </div>
                        )}

                        <form onSubmit={handleCreateAdmin} className="space-y-5">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name</label>
                              <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} required
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-300 transition-all" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Email Protocol</label>
                              <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-300 transition-all" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Temporary Cipher</label>
                              <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-300 transition-all" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Clearance Level</label>
                              <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value)}
                                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none appearance-none cursor-pointer">
                                 <option value="admin">Administrator (Standard)</option>
                                 <option value="superadmin">Superadmin (Full Access)</option>
                              </select>
                           </div>
                           <Button type="submit" size="lg" className="w-full rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-indigo-600/10">
                              <UserPlus size={16} /> Provision Admin
                           </Button>
                        </form>
                     </div>
                  </div>

                  <div className="lg:col-span-3">
                     <div className="bg-white border-2 border-border shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                           <div className="relative max-w-xs w-full group">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                              <input type="text" placeholder="Locate operator..." className="w-full pl-12 pr-4 h-12 bg-white border-2 border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-400 transition-all" />
                           </div>
                        </div>

                        <div className="overflow-x-auto">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <th className="px-10 py-6 border-b border-border">Operator Identity</th>
                                    <th className="px-10 py-6 border-b border-border">Clearance</th>
                                    <th className="px-10 py-6 border-b border-border text-right">Ops</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {admins.length === 0 ? (
                                   <tr>
                                      <td colSpan={3} className="px-10 py-32 text-center opacity-20"><Fingerprint size={64} className="mx-auto" /></td>
                                   </tr>
                                 ) : admins.map((admin, i) => (
                                    <tr key={admin.id} className="group hover:bg-slate-50/50 transition-all duration-300" style={{ animationDelay: `${i * 40}ms` }}>
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-5">
                                             <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">
                                                {admin.role === 'superadmin' ? <ShieldAlert size={20} /> : <Shield size={20} />}
                                             </div>
                                             <div>
                                                <p className="text-sm font-black text-slate-800 tracking-tight">{admin.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{admin.email}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6">
                                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border-2 ${
                                             admin.role === 'superadmin' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600'
                                          }`}>
                                             {admin.role}
                                          </span>
                                       </td>
                                       <td className="px-10 py-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                             <X size={16} />
                                          </button>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
