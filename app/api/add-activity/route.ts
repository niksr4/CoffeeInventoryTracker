import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"
import { requireModuleAccess, isModuleAccessError } from "@/lib/module-access"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"

export async function POST(request: Request) {
  try {
    const sessionUser = await requireModuleAccess("accounts")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const body = await request.json()
    const { code, reference } = body

    if (!code || !reference) {
      return NextResponse.json(
        { success: false, error: "Code and reference are required" },
        { status: 400 },
      )
    }

    // Check if code already exists
    const existingActivity = await runTenantQuery(
      accountsSql,
      tenantContext,
      accountsSql`
        SELECT code FROM account_activities
        WHERE code = ${code} AND tenant_id = ${tenantContext.tenantId}
      `,
    )

    if (existingActivity.length > 0) {
      return NextResponse.json({ success: false, error: "Activity code already exists" }, { status: 400 })
    }

    // Insert new activity
    await runTenantQuery(
      accountsSql,
      tenantContext,
      accountsSql`
        INSERT INTO account_activities (code, activity, tenant_id)
        VALUES (${code}, ${reference}, ${tenantContext.tenantId})
      `,
    )

    return NextResponse.json({ success: true, message: "Activity added successfully" })
  } catch (error) {
    console.error("Error adding activity:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, error: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add activity",
      },
      { status: 500 },
    )
  }
}
