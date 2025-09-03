import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('Role', ['OWNER', 'ADMIN', 'MEMBER', 'BILLING_ADMIN']);
export const planEnum = pgEnum('Plan', ['FREE', 'PRO', 'ENTERPRISE']);
export const subscriptionStatusEnum = pgEnum('SubscriptionStatus', ['INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELED']);
export const membershipStatusEnum = pgEnum('MembershipStatus', ['ACTIVE', 'INVITED', 'REMOVED']);