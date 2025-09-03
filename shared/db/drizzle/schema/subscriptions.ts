import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  timestamp,
  uuid,
  integer,
  varchar,
} from "drizzle-orm/pg-core";
import { planEnum } from "../enums";
import { tenants } from "./tenants";
import { subscriptionStatusEnum } from "../enums";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenantId")
    .notNull()
    .unique()
    .references(() => tenants.id),
  stripeSubId: varchar("stripeSubId", { length: 255 }).notNull().unique(),
  plan: planEnum("plan").notNull(),
  seats: integer("seats").default(1).notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const selectSubscriptionSchema = createSelectSchema(subscriptions);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
