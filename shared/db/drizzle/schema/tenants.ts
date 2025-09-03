import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { planEnum } from "../enums";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    ownerId: uuid("ownerId")
      .notNull()
      .references(() => profiles.id),
    stripeCustomerId: varchar("stripeCustomerId", { length: 255 }).unique(),
    plan: planEnum("plan").default("FREE").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    ownerIdIdx: index("tenants_ownerId_idx").on(table.ownerId),
  })
);

export const insertTenantSchema = createInsertSchema(tenants);
export const selectTenantSchema = createSelectSchema(tenants);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
