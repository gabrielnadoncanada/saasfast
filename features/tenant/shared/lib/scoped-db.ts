import { db } from "@/shared/db/drizzle/db";
import {
  getCurrentUserTenantContext,
  requireTenantContext,
  type TenantContext,
} from "./context";

/**
 * Database operations scoped to the current user's tenant.
 * This ensures data isolation between tenants.
 */
export class ScopedDatabase {
  constructor(private context: NonNullable<TenantContext>) {}

  get tenantId() {
    return this.context.tenant.id;
  }

  get userId() {
    return this.context.user.id;
  }

  get userRole() {
    return this.context.membership.role;
  }

  get db() {
    return db;
  }

  /**
   * Check if the current user has admin privileges (OWNER or ADMIN)
   */
  isAdmin(): boolean {
    return this.userRole === "OWNER" || this.userRole === "ADMIN";
  }

  /**
   * Check if the current user is the tenant owner
   */
  isOwner(): boolean {
    return this.userRole === "OWNER";
  }

  /**
   * Ensure the user has admin privileges, throw error if not
   */
  requireAdmin(): void {
    if (!this.isAdmin()) {
      throw new Error("Admin privileges required");
    }
  }

  /**
   * Ensure the user is the tenant owner, throw error if not
   */
  requireOwner(): void {
    if (!this.isOwner()) {
      throw new Error("Owner privileges required");
    }
  }
}

/**
 * Create a scoped database instance for the current user's tenant
 */
export async function getScopedDb(): Promise<ScopedDatabase> {
  const context = await getCurrentUserTenantContext();
  requireTenantContext(context);
  return new ScopedDatabase(context);
}

/**
 * Execute a function with a scoped database instance
 */
export async function withScopedDb<T>(
  fn: (scopedDb: ScopedDatabase) => Promise<T>
): Promise<T> {
  const scopedDb = await getScopedDb();
  return fn(scopedDb);
}
