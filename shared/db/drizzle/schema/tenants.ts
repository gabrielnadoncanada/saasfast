import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { planEnum } from "../enums";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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

    // Logo optionnel
    logoUrl: varchar("logoUrl", { length: 500 }),

    // Métadonnées
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    ownerIdIdx: index("tenants_ownerId_idx").on(table.ownerId),
  })
);

// Schémas de validation Zod
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTenantSchema = createSelectSchema(tenants);

export const updateTenantSchema = insertTenantSchema.partial().omit({
  ownerId: true,
});

// Types TypeScript
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type UpdateTenant = z.infer<typeof updateTenantSchema>;
