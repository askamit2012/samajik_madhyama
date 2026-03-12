import { useState, useEffect } from 'react'
import { Button } from '@repo/ui'
import { LayoutDashboard, Users, Key, LogOut, Menu, X } from 'lucide-react'

const PLATFORMS = ["facebook", "instagram", "linkedin", "twitter", "google"]

const PLATFORM_INFO: Record<string, { label: string; color: string; scopes: string; note?: string }> = {
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    scopes: "pages_show_list, pages_manage_posts",
    note: "Requires a Facebook App in Business Manager with Pages permissions."
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    scopes: "user_profile, user_media",
    note: "Uses separate Instagram Basic Display API app credentials."
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0077B5",
    scopes: "r_liteprofile, w_member_social",
  },
  twitter: {
    label: "Twitter / X",
    color: "#000000",
    scopes: "tweet.read, tweet.write, users.read",
    note: "Twitter requires OAuth 2.0 with PKCE enabled."
  },
  google: {
    label: "Google (Ads)",
    color: "#DB4437",
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
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "credentials" | "admins">("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Credentials State
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0])
  const [appId, setAppId] = useState("")
  const [appSecret, setAppSecret] = useState("")
  const [saveStatus, setSaveStatus] = useState("")

  // Admin Users State
  const [admins, setAdmins] = useState<User[]>([])
  const [newAdminName, setNewAdminName] = useState("")
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [newAdminRole, setNewAdminRole] = useState("admin")
  const [adminSaveStatus, setAdminSaveStatus] = useState("")

  useEffect(() => {
    if (token) fetchMe(token)
    else setAuthLoading(false)
  }, [token])

  useEffect(() => {
    if (user) {
      fetchCredentials()
      if (user.role === "superadmin") fetchAdmins()
    }
  }, [user])

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
      const res = await fetch("http://localhost:4000/auth/me", { headers: { "Authorization": `Bearer ${authToken}` } })
      if (res.ok) {
        const data = await res.json()
        if (data.user.role === "admin" || data.user.role === "superadmin") {
          setUser(data.user)
        } else handleLogout()
      } else handleLogout()
    } catch { handleLogout() } 
    finally { setAuthLoading(false) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.user.role === "admin" || data.user.role === "superadmin") {
          localStorage.setItem("admin_token", data.token)
          setToken(data.token)
          setUser(data.user)
        } else setAuthError("Unauthorized: Admins only.")
      } else setAuthError(data.error || "Login failed")
    } catch (err) { setAuthError("Failed to connect to server.") }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    setToken(null)
    setUser(null)
  }

  // --- CREDENTIALS API ---
  const fetchCredentials = async () => {
    try {
      const res = await fetch("http://localhost:4000/platform-credentials", { headers: { "Authorization": `Bearer ${token}` } })
      if (res.ok) setCredentials(await res.json())
    } catch(e) { console.error(e) }
  }

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus("Saving...")
    try {
      const res = await fetch("http://localhost:4000/platform-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ platform: selectedPlatform, appId, appSecret })
      })
      if (res.ok) {
        setSaveStatus("Saved successfully!")
        fetchCredentials()
      } else setSaveStatus("Failed to save.")
    } catch(e) { setSaveStatus("Error saving.") }
  }

  // --- ADMINS API ---
  const fetchAdmins = async () => {
    try {
      const res = await fetch("http://localhost:4000/admin-users", { headers: { "Authorization": `Bearer ${token}` } })
      if (res.ok) setAdmins(await res.json())
    } catch(e) { console.error(e) }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminSaveStatus("Saving...")
    try {
      const res = await fetch("http://localhost:4000/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: newAdminName, email: newAdminEmail, password: newAdminPassword, role: newAdminRole })
      })
      if (res.ok) {
        setAdminSaveStatus("Admin created successfully!")
        setNewAdminName("")
        setNewAdminEmail("")
        setNewAdminPassword("")
        fetchAdmins()
      } else {
        const data = await res.json()
        setAdminSaveStatus(`Failed: ${data.error}`)
      }
    } catch(e) { setAdminSaveStatus("Error creating admin.") }
  }

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  // ========== LOGIN SCREEN ==========
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Admin Portal
            </h1>
            <p className="text-muted-foreground mt-2">Authorized personnel only</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {authError && <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">{authError}</div>}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="p-3 border border-input rounded-md bg-background" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="p-3 border border-input rounded-md bg-background" />
            </div>
            <Button type="submit" size="lg" className="mt-2">Login</Button>
          </form>
        </div>
      </div>
    )
  }

  // ========== SIDE NAVIGATION COMPONENT ==========
  const SideNav = () => (
    <div className="w-64 bg-card h-full border-r border-border flex flex-col drop-shadow-sm sticky top-0">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          SuperUser OS
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded capitalize uppercase tracking-widest">
            {user.role}
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button 
          onClick={() => { setActiveScreen("dashboard"); setMobileMenuOpen(false); }}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
            activeScreen === "dashboard" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" /> Dashboard
        </button>

        <button 
          onClick={() => { setActiveScreen("credentials"); setMobileMenuOpen(false); }}
          className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
            activeScreen === "credentials" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          <Key className="h-5 w-5" /> OAuth Credentials
        </button>

        {user.role === "superadmin" && (
          <button 
            onClick={() => { setActiveScreen("admins"); setMobileMenuOpen(false); }}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
              activeScreen === "admins" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Users className="h-5 w-5" /> Administrators
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-4 px-2">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" /> Log out
        </Button>
      </div>
    </div>
  )

  // ========== MAIN DASHBOARD LAYOUT ==========
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
        <h2 className="text-lg font-bold">SuperUser OS</h2>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="hidden md:block h-screen shrink-0">
        <SideNav />
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="w-64 h-full animate-in slide-in-from-left">
            <SideNav />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-auto bg-muted/20 p-8">
        <div className="max-w-5xl mx-auto">
          
          {/* ----- HOME DASHBOARD ----- */}
          {activeScreen === "dashboard" && (
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back, {user.name.split(" ")[0]}!</h1>
              <p className="text-muted-foreground mb-8">System status and overview for the marketing organization.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Administrators</h3>
                  <div className="text-3xl font-bold">{admins.length || 1}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Configured Platforms</h3>
                  <div className="text-3xl font-bold">{credentials.length}</div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm border-primary/20">
                  <h3 className="text-sm font-medium text-primary mb-1">System Status</h3>
                  <div className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div> Healthy
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----- OAUTH TAB ----- */}
          {activeScreen === "credentials" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6 shadow-sm h-fit">
                <h2 className="text-xl font-semibold mb-4">Platforms</h2>
                <div className="flex flex-col gap-2">
                  {PLATFORMS.map(p => {
                    const info = PLATFORM_INFO[p]
                    const isConfigured = !!credentials.find(c => c.platform === p)
                    return (
                      <button key={p} onClick={() => setSelectedPlatform(p)}
                        className={`text-left px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-between ${
                          selectedPlatform === p ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/30 hover:bg-muted text-foreground"
                        }`}
                      >
                        <span>{info?.label || p}</span>
                        {isConfigured && (
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-wide">Active</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-8 shadow-sm">
                {(() => {
                  const info = PLATFORM_INFO[selectedPlatform]
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: info?.color || "#888" }} />
                        <h2 className="text-2xl font-semibold">{info?.label || selectedPlatform} Credentials</h2>
                      </div>
                      {info?.note && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
                          ⚠️ {info.note}
                        </div>
                      )}
                      <div className="mb-6 p-3 bg-muted/40 rounded-md text-sm font-mono text-muted-foreground">
                        <p className="font-sans font-medium text-foreground mb-1">OAuth Callback URI</p>
                        <p>http://localhost:4000/oauth/{selectedPlatform}/callback</p>
                        <p className="font-sans text-xs mt-1 text-muted-foreground">Register this URL in the platform's developer console</p>
                      </div>
                      <div className="mb-5 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Required Scopes: </span>
                        {info?.scopes}
                      </div>
                      <form onSubmit={handleSaveCredential} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">App ID / Client ID</label>
                          <input type="text" value={appId} onChange={e => setAppId(e.target.value)} required
                            placeholder={`${info?.label || selectedPlatform} App ID`}
                            className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-medium">App Secret / Client Secret</label>
                          <input type="password" value={appSecret} onChange={e => setAppSecret(e.target.value)} required
                            placeholder="••••••••••••••••••••"
                            className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <Button type="submit" size="lg">Save Credentials</Button>
                          {saveStatus && <span className="text-sm font-medium text-emerald-600">{saveStatus}</span>}
                        </div>
                      </form>
                    </>
                  )
                })()}
              </div>
            </div>
          )}


          {/* ----- ADMINS TAB ----- */}
          {activeScreen === "admins" && user.role === "superadmin" && (
            <div className="flex flex-col gap-8">
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Active Administrators</h2>
                </div>
                <div className="divide-y divide-border">
                  {admins.map(admin => (
                    <div key={admin.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {admin.name}
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${admin.role === 'superadmin' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-rose-500/10 text-rose-600'}`}>
                            {admin.role}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{admin.email}</div>
                      </div>
                    </div>
                  ))}
                  {admins.length === 0 && <div className="p-8 text-center text-muted-foreground">No other admins found.</div>}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-6">Create Administrator</h2>
                <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Name</label>
                    <input type="text" value={newAdminName} onChange={e => setNewAdminName(e.target.value)} required
                      className="p-3 border border-input rounded-md bg-background" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required
                      className="p-3 border border-input rounded-md bg-background" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Temporary Password</label>
                    <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required
                      className="p-3 border border-input rounded-md bg-background" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Role Level</label>
                    <select value={newAdminRole} onChange={e => setNewAdminRole(e.target.value)}
                      className="p-3 border border-input rounded-md bg-background h-full">
                      <option value="admin">Administrator (Standard)</option>
                      <option value="superadmin">Superadmin (Full Access)</option>
                    </select>
                  </div>
                  <div className="col-span-full mt-4 flex items-center gap-4">
                    <Button type="submit">Create User</Button>
                    {adminSaveStatus && <span className="text-sm font-medium text-emerald-600">{adminSaveStatus}</span>}
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
