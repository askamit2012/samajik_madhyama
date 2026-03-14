import { Queue, QueueEvents } from "bullmq"

// BullMQ accepts a Redis URL string directly — avoids ioredis version conflicts
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
const connection = { url: redisUrl }

// ============================================================
// CAMPAIGN QUEUE
// ============================================================
export const campaignQueue = new Queue("campaigns", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

// ============================================================
// Named export for worker connection config (reused in workers)
// ============================================================
export const bullmqConnection = connection

export const campaignQueueEvents = new QueueEvents("campaigns", {
  connection,
})
