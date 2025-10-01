import { NextResponse } from "next/server"
import { getAllActivityCodes, searchActivityCodes } from "@/lib/neon-accounts-storage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    let activities
    if (query) {
      activities = await searchActivityCodes(query)
    } else {
      activities = await getAllActivityCodes()
    }

    console.log("Fetched activities:", activities)

    return NextResponse.json({
      success: true,
      activities: activities.map((a) => ({
        code: a.code,
        reference: a.activity,
      })),
    })
  } catch (error) {
    console.error("Error in get-activity route:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch activity codes" }, { status: 500 })
  }
}
