import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    hashedPassword: varchar("hashedPassword", { length: 255 }),
    name: varchar("name", { length: 255 }),
    avatarUrl: varchar("avatarUrl", { length: 500 }),
    emailConfirmedAt: timestamp("emailConfirmedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("profiles_email_idx").on(table.email),
  })
);

export const insertProfileSchema = createInsertSchema(profiles);
export const selectProfileSchema = createSelectSchema(profiles);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
