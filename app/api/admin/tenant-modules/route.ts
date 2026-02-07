import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireAdminRole } from "@/lib/tenant"
import { requireSessionUser } from "@/lib/auth-server"
import { MODULES } from "@/lib/modules"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"

export async function GET(request: Request) {
  try {
    const sessionUser = await requireSessionUser()
    requireAdminRole(sessionUser.role)
    if (!sql) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const requestedTenantId = searchParams.get("tenantId")
    const tenantId = sessionUser.role === "owner" ? requestedTenantId : sessionUser.tenantId

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "tenantId is required" }, { status: 400 })
    }

    if (sessionUser.role !== "owner" && requestedTenantId && requestedTenantId !== sessionUser.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const tenantContext = normalizeTenantContext(tenantId, sessionUser.role)
    const rows = await runTenantQuery(
      sql,
      tenantContext,
      sql`
        SELECT module, enabled
        FROM tenant_modules
        WHERE tenant_id = ${tenantId}
      `,
    )

    const byModule = new Map(rows.map((row: any) => [String(row.module), Boolean(row.enabled)]))

    const modules = MODULES.map((module) => ({
      ...module,
      enabled: byModule.get(module.id) ?? true,
    }))

    return NextResponse.json({ success: true, modules })
  } catch (error: any) {
    console.error("Error fetching tenant modules:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch tenant modules" }, { status: 500 })
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
    const requestedTenantId = String(body.tenantId || "").trim()
    const tenantId = sessionUser.role === "owner" ? requestedTenantId : sessionUser.tenantId
    const modules = Array.isArray(body.modules) ? body.modules : []

    if (!tenantId) {
      return NextResponse.json({ success: false, error: "tenantId is required" }, { status: 400 })
    }

    if (sessionUser.role !== "owner" && requestedTenantId && requestedTenantId !== sessionUser.tenantId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const tenantContext = normalizeTenantContext(tenantId, sessionUser.role)
    for (const module of MODULES) {
      const enabled = Boolean(modules.find((m: any) => m.id === module.id)?.enabled)
      await runTenantQuery(
        sql,
        tenantContext,
        sql`
          INSERT INTO tenant_modules (tenant_id, module, enabled)
          VALUES (${tenantId}, ${module.id}, ${enabled})
          ON CONFLICT (tenant_id, module)
          DO UPDATE SET enabled = ${enabled}
        `,
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating tenant modules:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update tenant modules" }, { status: 500 })
  }
}
