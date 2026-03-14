"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@repo/ui"
import { useAuth } from "../../components/auth-provider"
import { api } from "../../lib/api"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try {
      const data = await api.post<{ token: string; user: any }>("/auth/signup", { name, email, password })
      login(data.token, data.user)
    } catch (err: any) {
      setError(err.message || "Signup failed")
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12">
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-xl shadow-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Create an Account
          </h1>
          <p className="text-muted-foreground mt-2">Get started with our marketing platform</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              minLength={6}
              required
            />
          </div>

          <Button type="submit" size="lg" className="mt-2" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
