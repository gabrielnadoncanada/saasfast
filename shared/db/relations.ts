import { relations } from 'drizzle-orm';
import { profiles, tenants, memberships, invitations, subscriptions, auditLogs } from './tables';

export const profilesRelations = relations(profiles, ({ many }) => ({
  memberships: many(memberships),
  ownedTenants: many(tenants),
  auditLogs: many(auditLogs),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [tenants.ownerId],
    references: [profiles.id],
  }),
  memberships: many(memberships),
  invitations: many(invitations),
  subscription: one(subscriptions),
  auditLogs: many(auditLogs),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(profiles, {
    fields: [memberships.userId],
    references: [profiles.id],
  }),
  tenant: one(tenants, {
    fields: [memberships.tenantId],
    references: [tenants.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invitations.tenantId],
    references: [tenants.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  actor: one(profiles, {
    fields: [auditLogs.actorId],
    references: [profiles.id],
  }),
}));