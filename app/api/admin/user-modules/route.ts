import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireAdminRole } from "@/lib/tenant"
import { requireSessionUser } from "@/lib/auth-server"
import { MODULES, MODULE_IDS } from "@/lib/modules"
import { normalizeTenantContext, runTenantQueries, runTenantQuery } from "@/lib/tenant-db"

type ModuleState = { id: string; label: string; enabled: boolean }

export async function GET(request: Request) {
  try {
    const sessionUser = await requireSessionUser()
    requireAdminRole(sessionUser.role)
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    const lookupContext = normalizeTenantContext(
      sessionUser.role === "owner" ? undefined : sessionUser.tenantId,
      sessionUser.role,
    )
    const [userRows, userModules, tenantModules] = await runTenantQueries(sql, lookupContext, [
      sql`
        SELECT id, tenant_id
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `,
      sql`
        SELECT module, enabled
        FROM user_modules
        WHERE user_id = ${userId}
      `,
      sql`
        SELECT module, enabled
        FROM tenant_modules
        WHERE tenant_id = (
          SELECT tenant_id FROM users WHERE id = ${userId} LIMIT 1
        )
      `,
    ])

    if (!userRows?.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const targetTenantId = String(userRows[0].tenant_id)
    if (sessionUser.role !== "owner" && targetTenantId !== sessionUser.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const source = userModules?.length ? "user" : tenantModules?.length ? "tenant" : "default"
    const byModule = new Map(
      (source === "user" ? userModules : source === "tenant" ? tenantModules : []).map((row: any) => [
        String(row.module),
        Boolean(row.enabled),
      ]),
    )

    const modules: ModuleState[] = MODULES.map((module) => ({
      ...module,
      enabled: byModule.get(module.id) ?? true,
    }))

    return NextResponse.json({ success: true, modules, source })
  } catch (error: any) {
    console.error("Error fetching user modules:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch user modules" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const sessionUser = await requireSessionUser()
    requireAdminRole(sessionUser.role)
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const body = await request.json()
    const userId = String(body.userId || "").trim()
    const modules = Array.isArray(body.modules) ? body.modules : []

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    const lookupContext = normalizeTenantContext(
      sessionUser.role === "owner" ? undefined : sessionUser.tenantId,
      sessionUser.role,
    )
    const userRows = await runTenantQuery(
      sql,
      lookupContext,
      sql`
        SELECT id, tenant_id
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `,
    )

    if (!userRows?.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const tenantId = String(userRows[0].tenant_id)
    if (sessionUser.role !== "owner" && tenantId !== sessionUser.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    for (const module of MODULE_IDS) {
      const enabled = Boolean(modules.find((m: any) => m.id === module)?.enabled)
      await runTenantQuery(
        sql,
        normalizeTenantContext(tenantId, sessionUser.role),
        sql`
          INSERT INTO user_modules (user_id, tenant_id, module, enabled)
          VALUES (${userId}, ${tenantId}, ${module}, ${enabled})
          ON CONFLICT (user_id, module)
          DO UPDATE SET enabled = ${enabled}
        `,
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating user modules:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update user modules" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionUser = await requireSessionUser()
    requireAdminRole(sessionUser.role)
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    const lookupContext = normalizeTenantContext(
      sessionUser.role === "owner" ? undefined : sessionUser.tenantId,
      sessionUser.role,
    )
    const userRows = await runTenantQuery(
      sql,
      lookupContext,
      sql`
        SELECT id, tenant_id
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `,
    )

    if (!userRows?.length) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const tenantId = String(userRows[0].tenant_id)
    if (sessionUser.role !== "owner" && tenantId !== sessionUser.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    await runTenantQuery(
      sql,
      normalizeTenantContext(tenantId, sessionUser.role),
      sql`
        DELETE FROM user_modules
        WHERE user_id = ${userId}
      `,
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error resetting user modules:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to reset user modules" }, { status: 500 })
  }
}
