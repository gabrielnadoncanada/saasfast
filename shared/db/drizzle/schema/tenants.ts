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

    // Informations de base de l'entreprise (fusionnées depuis tenant_profiles)
    businessName: varchar("businessName", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    website: varchar("website", { length: 255 }),

    // Adresse complète
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postalCode", { length: 20 }),
    country: varchar("country", { length: 100 }),

    // Informations fiscales et légales
    taxId: varchar("taxId", { length: 50 }),
    vatNumber: varchar("vatNumber", { length: 50 }),
    registrationNumber: varchar("registrationNumber", { length: 50 }),

    // Préférences et configuration
    language: varchar("language", { length: 10 }).default("en").notNull(),
    timezone: varchar("timezone", { length: 50 }).default("UTC"),
    currency: varchar("currency", { length: 3 }).default("USD"),

    // Informations supplémentaires
    industry: varchar("industry", { length: 100 }),
    description: text("description"),
    logoUrl: varchar("logoUrl", { length: 500 }),

    // Métadonnées
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => ({
    ownerIdIdx: index("tenants_ownerId_idx").on(table.ownerId),
    emailIdx: index("tenants_email_idx").on(table.email),
  })
);

// Schémas de validation Zod
export const insertTenantSchema = createInsertSchema(tenants, {
  email: z.string().email("Email invalide"),
  website: z
    .string()
    .url("URL du site web invalide")
    .optional()
    .or(z.literal("")),
  language: z
    .string()
    .min(2, "Le code de langue doit contenir au moins 2 caractères"),
  currency: z
    .string()
    .length(3, "Le code de devise doit contenir exactement 3 caractères"),
  phone: z.string().optional(),
}).omit({
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
