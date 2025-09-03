# Multi-Tenant & RBAC Implementation

This document outlines the multi-tenant architecture and role-based access control (RBAC) system implemented for Epic 2.

## Overview

The system provides complete data isolation between tenants while supporting flexible role-based permissions within each tenant.

## Features Implemented

### ✅ TEN-1: Auto-create tenant and owner membership

- **Location**: `features/auth/shared/lib/profile.ts`
- **Behavior**: When a user confirms their email (or signs up via OAuth), a default tenant and OWNER membership are automatically created
- **Transaction**: Uses database transactions to ensure atomicity

### ✅ TEN-2: Team member invitation system

- **Invite Action**: `features/tenant/invite/actions/invite.action.ts`
- **Accept Action**: `features/tenant/invite/actions/accept.action.ts`
- **Route**: `app/invite/[token]/route.ts`
- **Features**:
  - 7-day token expiry
  - Idempotent invitations (replaces existing pending invites)
  - Email validation against invitation
  - Automatic membership creation on acceptance

### ✅ TEN-3: Role management

- **Update Role**: `features/tenant/members/actions/update-role.action.ts`
- **Remove Member**: `features/tenant/members/actions/remove-member.action.ts`
- **Permissions**:
  - Only OWNER/ADMIN can change roles
  - Only OWNER can promote to OWNER
  - Only OWNER can remove other OWNERS
  - Prevents last OWNER from removing themselves

### ✅ TEN-4: Data isolation with tenant scoping

- **Scoped Database**: `features/tenant/shared/lib/scoped-db.ts`
- **Query Helpers**: `features/tenant/shared/lib/queries.ts`
- **Context Management**: `features/tenant/shared/lib/context.ts`

## Security Architecture

### Data Isolation

All database operations are automatically scoped to the current user's tenant:

```typescript
// Get current user's tenant context
const context = await getCurrentUserTenantContext();
requireTenantContext(context);

// Use scoped database operations
return await withScopedDb(async (scopedDb) => {
  return scopedDb.db
    .select()
    .from(someTable)
    .where(withTenantScope(scopedDb, someTable.tenantId));
});
```

### Permission Checks

Role-based permissions are enforced at the action level:

```typescript
// Check admin privileges
const canPerformAction = await isUserOwnerOrAdmin(userId, tenantId);
if (!canPerformAction) {
  return { success: false, error: "Insufficient permissions" };
}
```

### Transaction Safety

Critical operations use database transactions to ensure consistency:

```typescript
await db.transaction(async (trx) => {
  // Multiple operations that must succeed or fail together
  await trx.insert(tableA).values(dataA);
  await trx.update(tableB).set(dataB);
});
```

## Role Hierarchy

1. **OWNER** - Full control over tenant, billing, and members
2. **ADMIN** - Can manage members and content, no billing access
3. **BILLING_ADMIN** - Can manage billing and subscriptions
4. **MEMBER** - Basic access to tenant resources

## Database Schema

The multi-tenant system uses these core tables:

- `profiles` - User accounts (shared across tenants)
- `tenants` - Tenant/organization records
- `memberships` - User-tenant relationships with roles
- `invitations` - Pending invitations with tokens

## Usage Examples

### Creating a Tenant-Scoped Action

```typescript
"use server";

import { withScopedDb } from "@/features/tenant/shared/lib/scoped-db";
import { withTenantScope } from "@/features/tenant/shared/lib/queries";

export async function getMyData() {
  return await withScopedDb(async (scopedDb) => {
    // This query is automatically scoped to the user's tenant
    return scopedDb.db
      .select()
      .from(myTable)
      .where(withTenantScope(scopedDb, myTable.tenantId));
  });
}
```

### Checking Permissions

```typescript
export async function adminOnlyAction() {
  return await withScopedDb(async (scopedDb) => {
    // Ensure user has admin privileges
    scopedDb.requireAdmin();
    
    // Proceed with admin-only logic
    return doAdminStuff();
  });
}
```

## Testing

To ensure tenant isolation:

1. Create multiple test tenants
2. Verify cross-tenant queries return no data
3. Test all permission combinations
4. Validate transaction rollbacks on failures

## Future Enhancements

1. **Multi-tenant switching** - Allow users to switch between tenants
2. **Tenant-specific settings** - Custom configurations per tenant
3. **Advanced permissions** - Resource-level permissions
4. **Audit logging** - Track all tenant actions

## Compliance

This implementation satisfies the Epic 2 requirements:

- ✅ TEN-1: Auto-tenant creation on registration
- ✅ TEN-2: Email invitation system with 7-day expiry
- ✅ TEN-3: Role management with proper permissions
- ✅ TEN-4: Complete data isolation between tenants