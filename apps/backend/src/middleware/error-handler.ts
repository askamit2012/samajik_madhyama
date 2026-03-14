import { Request, Response, NextFunction } from "express"
import { logger } from "../lib/logger"

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers["x-request-id"]
  const statusCode = err.status || err.statusCode || 500
  
  logger.error({
    requestId,
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
  })

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    requestId,
    timestamp: new Date().toISOString()
  })
}
