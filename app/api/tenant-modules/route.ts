import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireSessionUser } from "@/lib/auth-server"
import { MODULE_IDS } from "@/lib/modules"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"

export async function GET(request: Request) {
  try {
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const sessionUser = await requireSessionUser()
    const tenantId = sessionUser.tenantId
    const tenantContext = normalizeTenantContext(tenantId, sessionUser.role)

    const userRows = await runTenantQuery(
      sql,
      tenantContext,
      sql`
        SELECT id
        FROM users
        WHERE username = ${sessionUser.username}
          AND tenant_id = ${tenantId}
        LIMIT 1
      `,
    )
    const userId = userRows?.[0]?.id

    if (userId) {
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
        return NextResponse.json({ success: true, modules: [...enabled, ...missing] })
      }
    }

    const rows = await runTenantQuery(
      sql,
      tenantContext,
      sql`
        SELECT module, enabled
        FROM tenant_modules
        WHERE tenant_id = ${tenantId}
      `,
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, modules: MODULE_IDS })
    }

    const enabled = rows.filter((row: any) => row.enabled).map((row: any) => String(row.module))
    const missing = MODULE_IDS.filter((moduleId) => !rows.some((row: any) => String(row.module) === moduleId))

    return NextResponse.json({ success: true, modules: [...enabled, ...missing] })
  } catch (error: any) {
    console.error("Error loading tenant modules:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to load modules" }, { status: 500 })
  }
}
