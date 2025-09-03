import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { roleEnum } from "../enums";
import { tenants } from "./tenants";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenantId")
      .notNull()
      .references(() => tenants.id),
    email: varchar("email", { length: 255 }).notNull(),
    role: roleEnum("role").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
  },
  (table) => ({
    tenantEmailUnique: unique("invitations_tenantId_email_key").on(
      table.tenantId,
      table.email
    ),
    tokenIdx: index("invitations_token_idx").on(table.token),
    expiresAtIdx: index("invitations_expiresAt_idx").on(table.expiresAt),
  })
);

export const insertInvitationSchema = createInsertSchema(invitations);
export const selectInvitationSchema = createSelectSchema(invitations);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
