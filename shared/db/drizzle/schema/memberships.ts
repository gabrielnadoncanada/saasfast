import { pgTable, uuid, timestamp, unique, index } from "drizzle-orm/pg-core";
import { membershipStatusEnum } from "../enums";
import { profiles } from "./profiles";
import { tenants } from "./tenants";
import { roleEnum } from "../enums";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => profiles.id),
    tenantId: uuid("tenantId")
      .notNull()
      .references(() => tenants.id),
    role: roleEnum("role").notNull(),
    status: membershipStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userTenantUnique: unique("memberships_userId_tenantId_key").on(
      table.userId,
      table.tenantId
    ),
    tenantRoleIdx: index("memberships_tenantId_role_idx").on(
      table.tenantId,
      table.role
    ),
    userStatusIdx: index("memberships_userId_status_idx").on(
      table.userId,
      table.status
    ),
  })
);

export const insertMembershipSchema = createInsertSchema(memberships);
export const selectMembershipSchema = createSelectSchema(memberships);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
