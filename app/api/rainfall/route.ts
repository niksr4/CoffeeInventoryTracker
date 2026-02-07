import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireModuleAccess, isModuleAccessError } from "@/lib/module-access"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"

const sql = neon(process.env.DATABASE_URL || "")

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireModuleAccess("rainfall")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Admin role required" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const records = await runTenantQuery(
      sql,
      tenantContext,
      sql`
        SELECT * FROM rainfall_records 
        WHERE tenant_id = ${tenantContext.tenantId}
        ORDER BY record_date DESC
      `,
    )
    return NextResponse.json({ success: true, records })
  } catch (error: any) {
    console.error("[v0] Error fetching rainfall records:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, error: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireModuleAccess("rainfall")
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const { record_date, inches, cents, notes, user_id } = await request.json()

    if (!record_date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    const result = await runTenantQuery(
      sql,
      tenantContext,
      sql`
        INSERT INTO rainfall_records (record_date, inches, cents, notes, user_id, tenant_id)
        VALUES (${record_date}, ${inches || 0}, ${cents || 0}, ${notes || ""}, ${user_id || "unknown"}, ${tenantContext.tenantId})
        RETURNING *
      `,
    )

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error: any) {
    console.error("[v0] Error saving rainfall record:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, error: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const sessionUser = await requireModuleAccess("rainfall")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Admin role required" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    await runTenantQuery(
      sql,
      tenantContext,
      sql`DELETE FROM rainfall_records WHERE id = ${id} AND tenant_id = ${tenantContext.tenantId}`,
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting rainfall record:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, error: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
