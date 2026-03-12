"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@repo/ui"
import { useSearchParams } from "next/navigation"
import { useAuth } from "../../../components/auth-provider"
import { CheckCircle, AlertCircle, ExternalLink, Unlink } from "lucide-react"

type Connection = {
  id: number
  platform: string
  createdAt: string
  expiresAt: string | null
  platformUserId: string | null
}

const PLATFORM_META: Record<string, { label: string; color: string; icon: string; description: string }> = {
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    icon: "f",
    description: "Publish posts to your Facebook Pages and reach your audience.",
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    icon: "ig",
    description: "Share photos, reels and stories to your Instagram profile.",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0077B5",
    icon: "in",
    description: "Share professional updates and articles with your network.",
  },
  twitter: {
    label: "Twitter / X",
    color: "#000000",
    icon: "𝕏",
    description: "Post tweets and threads to engage your Twitter audience.",
  },
  google: {
    label: "Google (Ads)",
    color: "#DB4437",
    icon: "G",
    description: "Connect your Google account to manage Ads campaigns.",
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
      const res = await fetch("http://localhost:4000/oauth/connections", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setConnections(await res.json())
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
      const res = await fetch(`http://localhost:4000/oauth/connections/${platform}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.platform !== platform))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDisconnecting(null)
    }
  }

  const handleConnect = (platform: string) => {
    // Backend /oauth/:platform/connect expects the auth token as a query param
    // to initiate the state JWT. We can't set headers on a redirect, so we
    // temporarily store the token in sessionStorage for the callback to pick up —
    // or better, pass it via Authorization. The backend reads it from the
    // Bearer Authorization header which works for API calls but not redirects.
    //
    // Solution: backend /connect is protected by authenticate middleware which
    // reads from query param as fallback. We pass the token as query param.
    window.location.href = `http://localhost:4000/oauth/${platform}/connect?auth_token=${token}`
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Link your social profiles to publish content across all your platforms.
        </p>
      </div>

      {successPlatform && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p><span className="font-semibold capitalize">{PLATFORM_META[successPlatform]?.label || successPlatform}</span> account connected successfully!</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">Connection failed: </span>
            {errorMessage === "missing_credentials"
              ? "This platform has not been configured by the admin yet."
              : errorMessage === "token_exchange_failed"
              ? "Could not exchange the authorization code. Check your app credentials."
              : errorMessage}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p} className="h-48 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((platform) => {
            const meta = PLATFORM_META[platform]
            const connection = connections.find((c) => c.platform === platform)
            const isConnected = !!connection

            return (
              <div
                key={platform}
                className={`relative p-6 bg-card border rounded-xl shadow-sm flex flex-col justify-between min-h-[180px] transition-all ${
                  isConnected ? "border-primary/40 shadow-primary/5 shadow-md" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                {/* Platform icon */}
                <div
                  className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: meta?.color || "#888" }}
                >
                  {meta?.icon}
                </div>

                <div className="space-y-1 pr-10">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{meta?.label || platform}</h3>
                    {isConnected && (
                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-wide">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{meta?.description}</p>
                  {isConnected && connection?.platformUserId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {connection.platformUserId}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
                      onClick={() => handleDisconnect(platform)}
                      disabled={disconnecting === platform}
                    >
                      <Unlink className="h-3.5 w-3.5 mr-1.5" />
                      {disconnecting === platform ? "Disconnecting..." : "Disconnect"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      style={{ backgroundColor: meta?.color }}
                      onClick={() => handleConnect(platform)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Connect {meta?.label}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="p-4 border border-dashed rounded-lg text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Note</p>
        <p>
          Platform connections use OAuth 2.0. You will be redirected to the platform to authorize access. 
          If a platform shows an error, it may not be configured yet — contact your admin.
        </p>
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
