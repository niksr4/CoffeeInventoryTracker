import { redis, safeRedisOperation } from "./redis"
import { getTenantKey } from "./tenant"

// Tenant-scoped Redis operations
export class TenantRedis {
  constructor(private tenantId: string) {}

  // Get tenant-scoped key
  private getKey(key: string): string {
    return getTenantKey(this.tenantId, key)
  }

  // Tenant-scoped get operation
  async get<T>(key: string): Promise<T | null> {
    return safeRedisOperation(async () => {
      if (!redis) throw new Error("Redis client not initialized")
      return await redis.get<T>(this.getKey(key))
    })
  }

  // Tenant-scoped set operation
  async set<T>(key: string, value: T): Promise<boolean> {
    return (
      safeRedisOperation(async () => {
        if (!redis) throw new Error("Redis client not initialized")
        await redis.set(this.getKey(key), value)
        return true
      }) || false
    )
  }

  // Tenant-scoped hash operations
  async hget(key: string, field: string): Promise<string | null> {
    return safeRedisOperation(async () => {
      if (!redis) throw new Error("Redis client not initialized")
      return await redis.hget(this.getKey(key), field)
    })
  }

  async hset(key: string, fieldValues: Record<string, string | number>): Promise<boolean> {
    return (
      safeRedisOperation(async () => {
        if (!redis) throw new Error("Redis client not initialized")
        await redis.hset(this.getKey(key), fieldValues)
        return true
      }) || false
    )
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    return safeRedisOperation(async () => {
      if (!redis) throw new Error("Redis client not initialized")
      return await redis.hgetall(this.getKey(key))
    })
  }

  async del(key: string): Promise<boolean> {
    return (
      safeRedisOperation(async () => {
        if (!redis) throw new Error("Redis client not initialized")
        await redis.del(this.getKey(key))
        return true
      }) || false
    )
  }

  // Get all tenant keys (for cleanup/migration)
  async getAllTenantKeys(): Promise<string[]> {
    return (
      safeRedisOperation(async () => {
        if (!redis) throw new Error("Redis client not initialized")
        const pattern = this.getKey("*")
        return await redis.keys(pattern)
      }) || []
    )
  }
}

// Factory function to create tenant-scoped Redis client
export function createTenantRedis(tenantId: string): TenantRedis {
  return new TenantRedis(tenantId)
}

// Tenant-scoped key constants
export const TENANT_KEYS = {
  TRANSACTIONS: "inventory:transactions",
  INVENTORY_HASH: "inventory:items",
  LAST_UPDATE: "inventory:lastUpdate",
  LABOR_DEPLOYMENTS: "labor:deployments",
  INVENTORY_ITEMS: "data:inventory_items",
  INVENTORY_TRANSACTIONS: "data:inventory_transactions",
  CONSUMABLE_DEPLOYMENTS: "data:consumable_deployments",
  USERS: "users",
  SETTINGS: "settings",
  SUBSCRIPTION: "subscription",
}
