"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api } from "../lib/api"

type User = {
  id: number
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      fetchUser(storedToken)
    } else {
      setLoading(false)
      checkPathAccess(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading) {
      checkPathAccess(user)
    }
  }, [pathname, user, loading])

  const fetchUser = async (authToken: string) => {
    try {
      const data = await api.get<{ user: User }>("/auth/me", authToken)
      setUser(data.user)
    } catch {
      doLogout()
    } finally {
      setLoading(false)
    }
  }

  const checkPathAccess = (currentUser: User | null) => {
    const isAuthRoute = pathname === "/login" || pathname === "/signup"
    // Protect all routes except login and signup
    if (!currentUser && !isAuthRoute) {
      router.push("/login")
    }
    // Dont show auth routes if logged in
    if (currentUser && isAuthRoute) {
      router.push("/")
    }
  }

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(newUser)
    router.push("/")
  }

  const doLogout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout: doLogout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
