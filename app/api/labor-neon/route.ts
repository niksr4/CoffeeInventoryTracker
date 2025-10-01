import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("📡 Fetching all labor transactions from accounts_db...")

    const result = await accountsSql`
      SELECT 
        id,
        deployment_date as date,
        code,
        hf_laborers,
        hf_cost_per_laborer,
        outside_laborers,
        outside_cost_per_laborer,
        total_cost,
        notes
      FROM labor_transactions
      ORDER BY deployment_date DESC
    `

    // Transform the data to match the expected format
    const deployments = result.map((row: any) => {
      const laborEntries = []

      // Add HF labor entry
      if (row.hf_laborers && row.hf_laborers > 0) {
        laborEntries.push({
          name: "HoneyFarm",
          laborCount: row.hf_laborers,
          costPerLabor: Number.parseFloat(row.hf_cost_per_laborer || 0),
        })
      }

      // Add outside labor entry
      if (row.outside_laborers && row.outside_laborers > 0) {
        laborEntries.push({
          name: "Outside Labor",
          laborCount: row.outside_laborers,
          costPerLabor: Number.parseFloat(row.outside_cost_per_laborer || 0),
        })
      }

      // Get reference from account_activities
      return {
        id: row.id,
        date: row.date,
        code: row.code,
        reference: "", // Will be filled by join or separate query
        laborEntries,
        totalCost: Number.parseFloat(row.total_cost),
        notes: row.notes || "",
        user: "system",
      }
    })

    // Fetch references for all codes
    const codes = [...new Set(deployments.map((d) => d.code))]
    if (codes.length > 0) {
      const references = await accountsSql`
        SELECT code, activity as reference
        FROM account_activities
        WHERE code = ANY(${codes})
      `

      const referenceMap = new Map(references.map((r: any) => [r.code, r.reference]))

      deployments.forEach((d) => {
        d.reference = referenceMap.get(d.code) || d.code
      })
    }

    console.log(`✅ Found ${deployments.length} labor deployments`)

    return NextResponse.json({
      success: true,
      deployments,
    })
  } catch (error: any) {
    console.error("❌ Error fetching labor deployments:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        deployments: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, code, reference, laborEntries, totalCost, notes, user } = body

    console.log("➕ Adding new labor deployment:", { code, reference, totalCost })

    // Extract HF and outside labor details
    const hfEntry = laborEntries.find((e: any) => e.name === "HoneyFarm")
    const outsideEntry = laborEntries.find((e: any) => e.name === "Outside Labor")

    const result = await accountsSql`
      INSERT INTO labor_transactions (
        deployment_date,
        code,
        hf_laborers,
        hf_cost_per_laborer,
        outside_laborers,
        outside_cost_per_laborer,
        total_cost,
        notes
      ) VALUES (
        ${date}::timestamp,
        ${code},
        ${hfEntry?.laborCount || 0},
        ${hfEntry?.costPerLabor || 0},
        ${outsideEntry?.laborCount || 0},
        ${outsideEntry?.costPerLabor || 0},
        ${totalCost},
        ${notes}
      )
      RETURNING id
    `

    console.log("✅ Labor deployment added successfully")

    return NextResponse.json({
      success: true,
      id: result[0].id,
    })
  } catch (error: any) {
    console.error("❌ Error adding labor deployment:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, date, code, reference, laborEntries, totalCost, notes } = body

    console.log("📝 Updating labor deployment:", id)

    // Extract HF and outside labor details
    const hfEntry = laborEntries.find((e: any) => e.name === "HoneyFarm")
    const outsideEntry = laborEntries.find((e: any) => e.name === "Outside Labor")

    await accountsSql`
      UPDATE labor_transactions
      SET
        deployment_date = ${date}::timestamp,
        code = ${code},
        hf_laborers = ${hfEntry?.laborCount || 0},
        hf_cost_per_laborer = ${hfEntry?.costPerLabor || 0},
        outside_laborers = ${outsideEntry?.laborCount || 0},
        outside_cost_per_laborer = ${outsideEntry?.costPerLabor || 0},
        total_cost = ${totalCost},
        notes = ${notes}
      WHERE id = ${id}
    `

    console.log("✅ Labor deployment updated successfully")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Error updating labor deployment:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    console.log("🗑️ Deleting labor deployment:", id)

    await accountsSql`
      DELETE FROM labor_transactions
      WHERE id = ${id}
    `

    console.log("✅ Labor deployment deleted successfully")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Error deleting labor deployment:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
