/**
 * Centralized API client
 * Base URL comes from env var — falls back to localhost for dev.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

type Method = "GET" | "POST" | "PUT" | "DELETE"

interface FetchOptions {
  token?: string | null
  body?: unknown
  method?: Method
}

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { token, body, method = body ? "POST" : "GET" } = opts
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data as T
}

export const api = {
  get:    <T>(path: string, token?: string | null) =>
    request<T>(path, { token, method: "GET" }),

  post:   <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { token, body, method: "POST" }),

  put:    <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { token, body, method: "PUT" }),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { token, method: "DELETE" }),

  /** For redirect-based flows (OAuth) — returns the full URL string */
  url: (path: string) => `${BASE}${path}`,
}
