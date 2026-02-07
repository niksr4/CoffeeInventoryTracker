export const TENANT_HEADER = "x-tenant-id"
export const ROLE_HEADER = "x-user-role"

export function buildTenantHeaders(tenantId?: string): HeadersInit {
  return tenantId ? { [TENANT_HEADER]: tenantId } : ({} as Record<string, string>)
}

export function buildAuthHeaders(tenantId?: string, role?: string): HeadersInit {
  const headers: Record<string, string> = {}
  if (tenantId) headers[TENANT_HEADER] = tenantId
  if (role) headers[ROLE_HEADER] = role
  return headers
}

export function getTenantIdFromRequest(request: Request): string | null {
  return request.headers.get(TENANT_HEADER)
}

export function requireTenantId(request: Request): string {
  const tenantId = getTenantIdFromRequest(request)
  if (!tenantId) {
    throw new Error("Tenant ID is required")
  }
  return tenantId
}

export function requireAdminRole(input: Request | string | null | undefined): void {
  const role = typeof input === "string" ? input : input?.headers.get(ROLE_HEADER)
  if (role !== "owner" && role !== "admin") {
    throw new Error("Admin role required")
  }
}

export function requireOwnerRole(input: Request | string | null | undefined): void {
  const role = typeof input === "string" ? input : input?.headers.get(ROLE_HEADER)
  if (role !== "owner") {
    throw new Error("Owner role required")
  }
}
