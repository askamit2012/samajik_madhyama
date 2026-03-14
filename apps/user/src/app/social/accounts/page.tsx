"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@repo/ui"
import { useSearchParams } from "next/navigation"
import { useAuth } from "../../../components/auth-provider"
import { api } from "../../../lib/api"
import { 
  CheckCircle, AlertCircle, ExternalLink, Unlink, 
  Facebook, Instagram, Linkedin, Twitter, Globe, Info
} from "lucide-react"

interface Connection {
  id: number
  platform: string
  createdAt: string
  expiresAt: string | null
  platformUserId: string | null
}

const PLATFORM_META: Record<string, { label: string; color: string; icon: any; description: string }> = {
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    icon: Facebook,
    description: "Publish to your Facebook Pages and reach your audience.",
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    icon: Instagram,
    description: "Share photos, reels and stories to your Instagram profile.",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0077B5",
    icon: Linkedin,
    description: "Share professional updates with your LinkedIn network.",
  },
  twitter: {
    label: "Twitter / X",
    color: "#000000",
    icon: Twitter,
    description: "Post tweets and threads to engage your audience.",
  },
  google: {
    label: "Google (Ads)",
    color: "#DB4437",
    icon: Globe,
    description: "Connect your Google account to manage campaigns.",
  },
}

const PLATFORMS = ["facebook", "instagram", "linkedin", "twitter", "google"]

function AccountsContent() {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const successPlatform = searchParams.get("success") ? searchParams.get("platform") : null
  const errorMessage = searchParams.get("error")

  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    if (token) fetchConnections()
  }, [token])

  const fetchConnections = async () => {
    try {
      const data = await api.get<Connection[]>("/oauth/connections", token)
      setConnections(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect your ${PLATFORM_META[platform]?.label || platform} account?`)) return
    setDisconnecting(platform)
    try {
      await api.delete(`/oauth/connections/${platform}`, token)
      setConnections((prev) => prev.filter((c) => c.platform !== platform))
    } catch (e) {
      console.error(e)
    } finally {
      setDisconnecting(null)
    }
  }

  const handleConnect = (platform: string) => {
    window.location.href = `${api.url(`/oauth/${platform}/connect`)}?auth_token=${token}`
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight">Connected <span className="gradient-text">Accounts</span></h1>
          <p className="text-muted-foreground text-lg">
            Link your social profiles to orchestrate content across the digital landscape.
          </p>
        </div>
      </div>

      {successPlatform && (
        <div className="flex items-center gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 animate-bounce-in shadow-lg shadow-emerald-500/5">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
             <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-base">Connection Successful!</p>
            <p className="text-sm opacity-80">Your <span className="capitalize">{PLATFORM_META[successPlatform]?.label || successPlatform}</span> account is now linked and ready for action.</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-4 p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-700 animate-shake shadow-lg shadow-red-500/5">
          <div className="h-10 w-10 rounded-2xl bg-red-500 flex items-center justify-center text-white shrink-0">
             <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-base">Connection Failed</p>
            <p className="text-sm opacity-80">
              {errorMessage === "missing_credentials"
                ? "This platform has not been configured by the admin yet."
                : errorMessage === "token_exchange_failed"
                ? "Could not exchange the authorization code. Check your app credentials."
                : errorMessage}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORMS.map((p) => (
            <div key={p} className="h-64 bg-white border border-border rounded-[2.5rem] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {PLATFORMS.map((platform, i) => {
            const meta = PLATFORM_META[platform]
            const connection = connections.find((c) => c.platform === platform)
            const isConnected = !!connection
            const PIcon = meta?.icon || Globe

            return (
              <div
                key={platform}
                style={{ animationDelay: `${i * 100}ms` }}
                className={`group relative p-8 bg-white border-2 rounded-[2.5rem] transition-all duration-500 flex flex-col justify-between min-h-[260px] ${
                  isConnected 
                    ? "border-primary/20 shadow-xl shadow-primary/5 hover:translate-y-[-4px]" 
                    : "border-border/60 border-dashed hover:border-primary/30 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                   <div 
                    className="h-14 w-14 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-500"
                    style={{ 
                       backgroundColor: isConnected ? meta?.color : '#f1f5f9',
                       color: isConnected ? 'white' : '#94a3b8' 
                    }}
                  >
                    <PIcon size={28} />
                  </div>
                  {isConnected && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                      <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                      Connected
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-black tracking-tight">{meta?.label || platform}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{meta?.description}</p>
                  {isConnected && connection?.platformUserId && (
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-slate-500 tracking-wider">
                      U-ID: {connection.platformUserId}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-border/50">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-2xl h-11 text-xs font-bold uppercase tracking-widest group-hover:bg-red-50 group-hover:text-destructive group-hover:border-red-200 transition-all duration-300"
                      onClick={() => handleDisconnect(platform)}
                      disabled={disconnecting === platform}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      {disconnecting === platform ? "..." : "Disconnect"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-2xl h-11 text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                      style={{ backgroundColor: meta?.color }}
                      onClick={() => handleConnect(platform)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Link Account
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="glass rounded-[2rem] p-8 flex items-start gap-4 animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="h-10 w-10 rounded-2xl bg-white border border-border flex items-center justify-center text-primary shrink-0 shadow-sm">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-base">Secure OAuth Authorization</p>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            We use industry-standard OAuth 2.0 to securely connect your accounts. We never see your platform passwords. 
            Authorization tokens are encrypted and handled with strict privacy protocols.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SocialAccountsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading accounts...</div>}>
      <AccountsContent />
    </Suspense>
  )
}
