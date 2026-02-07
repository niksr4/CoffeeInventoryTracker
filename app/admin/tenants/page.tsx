import AdminPage from "@/components/admin-page"
import { requireSessionUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function TenantsPage() {
  const sessionUser = await requireSessionUser()
  if (sessionUser.role !== "owner") {
    redirect("/dashboard")
  }

  return <AdminPage />
}
