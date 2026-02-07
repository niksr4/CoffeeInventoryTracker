import TenantSettingsPage from "@/components/tenant-settings-page"
import { requireSessionUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const sessionUser = await requireSessionUser()
  if (sessionUser.role === "user") {
    redirect("/dashboard")
  }

  return <TenantSettingsPage />
}
