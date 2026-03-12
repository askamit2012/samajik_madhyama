import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only"

export interface AuthRequest extends Request {
  user?: {
    id: number
    role: string
  }
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check Authorization header first, then fall back to query param (for OAuth redirects)
  const authHeader = req.headers.authorization
  const queryToken = req.query.auth_token as string | undefined
  
  const token = authHeader?.startsWith("Bearer ") 
    ? authHeader.split(" ")[1] 
    : queryToken

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing token" })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number, role: string }
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" })
  }
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
    return res.status(403).json({ error: "Forbidden: Admins only" })
  }
  next()
}

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Forbidden: Superadmins only" })
  }
  next()
}
