import { sql } from "@/lib/neon"
import { MODULE_IDS } from "@/lib/modules"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"
import { requireSessionUser, type SessionUser } from "@/lib/auth-server"

export class ModuleAccessError extends Error {
  constructor(message = "Module access disabled") {
    super(message)
    this.name = "ModuleAccessError"
  }
}

export const isModuleAccessError = (error: unknown) =>
  Boolean(error && (error as Error).name === "ModuleAccessError")

const isMissingRelation = (error: unknown, relation: string) => {
  const message = String((error as Error)?.message || error)
  return message.includes(`relation "${relation}" does not exist`)
}

export async function getEnabledModules(sessionUser?: SessionUser): Promise<string[]> {
  const user = sessionUser ?? (await requireSessionUser())

  if (user.role === "owner") {
    return MODULE_IDS
  }

  if (!sql) {
    throw new Error("Database not configured")
  }

  const tenantContext = normalizeTenantContext(user.tenantId, user.role)
  const userRows = await runTenantQuery(
    sql,
    tenantContext,
    sql`
      SELECT id
      FROM users
      WHERE username = ${user.username}
        AND tenant_id = ${user.tenantId}
      LIMIT 1
    `,
  )
  const userId = userRows?.[0]?.id

  if (userId) {
    try {
      const userModules = await runTenantQuery(
        sql,
        tenantContext,
        sql`
          SELECT module, enabled
          FROM user_modules
          WHERE user_id = ${userId}
        `,
      )
      if (userModules?.length) {
        const enabled = userModules.filter((row: any) => row.enabled).map((row: any) => String(row.module))
        const missing = MODULE_IDS.filter((moduleId) =>
          !userModules.some((row: any) => String(row.module) === moduleId),
        )
        return [...enabled, ...missing]
      }
    } catch (error) {
      if (!isMissingRelation(error, "user_modules")) {
        throw error
      }
    }
  }

  const tenantModules = await runTenantQuery(
    sql,
    tenantContext,
    sql`
      SELECT module, enabled
      FROM tenant_modules
      WHERE tenant_id = ${user.tenantId}
    `,
  )

  if (!tenantModules?.length) {
    return MODULE_IDS
  }

  const enabled = tenantModules.filter((row: any) => row.enabled).map((row: any) => String(row.module))
  const missing = MODULE_IDS.filter((moduleId) =>
    !tenantModules.some((row: any) => String(row.module) === moduleId),
  )
  return [...enabled, ...missing]
}

export async function requireModuleAccess(moduleId: string, sessionUser?: SessionUser): Promise<SessionUser> {
  const user = sessionUser ?? (await requireSessionUser())

  if (user.role === "owner") {
    return user
  }

  const enabled = await getEnabledModules(user)
  if (!enabled.includes(moduleId)) {
    throw new ModuleAccessError()
  }

  return user
}
