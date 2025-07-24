import { pgTable, uuid, varchar, timestamp, integer, json, unique, index } from 'drizzle-orm/pg-core';
import { roleEnum, planEnum, subscriptionStatusEnum, membershipStatusEnum } from './enums';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  hashedPassword: varchar('hashedPassword', { length: 255 }),
  name: varchar('name', { length: 255 }),
  avatarUrl: varchar('avatarUrl', { length: 500 }),
  emailConfirmedAt: timestamp('emailConfirmedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('profiles_email_idx').on(table.email),
}));

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('ownerId').notNull().references(() => profiles.id),
  stripeCustomerId: varchar('stripeCustomerId', { length: 255 }).unique(),
  plan: planEnum('plan').default('FREE').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  deletedAt: timestamp('deletedAt'),
}, (table) => ({
  ownerIdIdx: index('tenants_ownerId_idx').on(table.ownerId),
}));

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => profiles.id),
  tenantId: uuid('tenantId').notNull().references(() => tenants.id),
  role: roleEnum('role').notNull(),
  status: membershipStatusEnum('status').default('ACTIVE').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  userTenantUnique: unique('memberships_userId_tenantId_key').on(table.userId, table.tenantId),
  tenantRoleIdx: index('memberships_tenantId_role_idx').on(table.tenantId, table.role),
  userStatusIdx: index('memberships_userId_status_idx').on(table.userId, table.status),
}));

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenantId').notNull().references(() => tenants.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: roleEnum('role').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  acceptedAt: timestamp('acceptedAt'),
}, (table) => ({
  tenantEmailUnique: unique('invitations_tenantId_email_key').on(table.tenantId, table.email),
  tokenIdx: index('invitations_token_idx').on(table.token),
  expiresAtIdx: index('invitations_expiresAt_idx').on(table.expiresAt),
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenantId').notNull().unique().references(() => tenants.id),
  stripeSubId: varchar('stripeSubId', { length: 255 }).notNull().unique(),
  plan: planEnum('plan').notNull(),
  seats: integer('seats').default(1).notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  currentPeriodEnd: timestamp('currentPeriodEnd').notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const auditLogs = pgTable('auditLogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenantId').notNull().references(() => tenants.id),
  actorId: uuid('actorId').references(() => profiles.id),
  action: varchar('action', { length: 255 }).notNull(),
  target: varchar('target', { length: 255 }).notNull(),
  meta: json('meta'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
}, (table) => ({
  tenantCreatedAtIdx: index('auditLogs_tenantId_createdAt_idx').on(table.tenantId, table.createdAt),
}));