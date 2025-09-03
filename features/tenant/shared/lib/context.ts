import { createClient } from "@/shared/db/supabase/server";
import { getUserTenants } from "./tenant";

export async function getCurrentUserTenantContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const userTenants = await getUserTenants(user.id);

  // For now, return the first tenant (we can add tenant switching later)
  // In a multi-tenant app, you might store the "current tenant" in session/cookie
  const currentTenant = userTenants[0];

  if (!currentTenant) {
    return null;
  }

  return {
    user,
    tenant: currentTenant.tenant,
    membership: currentTenant.membership,
    role: currentTenant.membership.role,
  };
}

export type TenantContext = Awaited<
  ReturnType<typeof getCurrentUserTenantContext>
>;

export function requireTenantContext(
  context: TenantContext
): asserts context is NonNullable<TenantContext> {
  if (!context) {
    throw new Error("User must be authenticated and have a tenant");
  }
}
