import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  json,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { profiles } from "./profiles";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const auditLogs = pgTable(
  "auditLogs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenantId")
      .notNull()
      .references(() => tenants.id),
    actorId: uuid("actorId").references(() => profiles.id),
    action: varchar("action", { length: 255 }).notNull(),
    target: varchar("target", { length: 255 }).notNull(),
    meta: json("meta"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    tenantCreatedAtIdx: index("auditLogs_tenantId_createdAt_idx").on(
      table.tenantId,
      table.createdAt
    ),
  })
);

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const selectAuditLogSchema = createSelectSchema(auditLogs);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
