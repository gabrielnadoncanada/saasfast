import { eq, and, SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { ScopedDatabase } from "./scoped-db";

/**
 * Helper to add tenant scoping to any query.
 * This ensures that all queries are automatically scoped to the current tenant.
 */
export function withTenantScope(
  scopedDb: ScopedDatabase,
  tenantIdColumn: PgColumn,
  additionalWhere?: SQL
) {
  const tenantCondition = eq(tenantIdColumn, scopedDb.tenantId);
  
  if (additionalWhere) {
    return and(tenantCondition, additionalWhere);
  }
  
  return tenantCondition;
}

/**
 * Example usage functions for common tables.
 * These serve as examples of how to implement tenant-scoped queries.
 */

// Example: Scoped queries for a hypothetical "posts" table
export function createTenantScopedQueries() {
  return {
    async getPosts(scopedDb: ScopedDatabase, additionalWhere?: SQL) {
      // Example implementation - replace with actual table
      // return scopedDb.db
      //   .select()
      //   .from(posts)
      //   .where(withTenantScope(scopedDb, posts.tenantId, additionalWhere));
    },

    async createPost(scopedDb: ScopedDatabase, data: any) {
      // Example implementation - replace with actual table
      // return scopedDb.db
      //   .insert(posts)
      //   .values({
      //     ...data,
      //     tenantId: scopedDb.tenantId,
      //   });
    },

    async updatePost(scopedDb: ScopedDatabase, postId: string, data: any) {
      // Example implementation - replace with actual table
      // return scopedDb.db
      //   .update(posts)
      //   .set(data)
      //   .where(withTenantScope(scopedDb, posts.tenantId, eq(posts.id, postId)));
    },

    async deletePost(scopedDb: ScopedDatabase, postId: string) {
      // Example implementation - replace with actual table
      // return scopedDb.db
      //   .delete(posts)
      //   .where(withTenantScope(scopedDb, posts.tenantId, eq(posts.id, postId)));
    },
  };
}