import { NextFunction, Request, Response } from "express"
import crypto from "crypto"

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export function requireOpsToken(req: Request, res: Response, next: NextFunction) {
  const configuredToken = process.env.OPS_TRIGGER_TOKEN
  if (!configuredToken) {
    return res.status(404).json({ error: "Not found" })
  }

  const authHeader = req.headers.authorization
  const bearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null
  const headerToken = (req.headers["x-ops-token"] as string | undefined) || null

  const providedToken = bearerToken || headerToken
  if (!providedToken) {
    return res.status(401).json({ error: "Unauthorized: Missing ops token" })
  }

  if (!safeEqual(providedToken, configuredToken)) {
    return res.status(403).json({ error: "Forbidden" })
  }

  next()
}

