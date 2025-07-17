# API Specifications & Zod Schemas

*Scope : MVP flows (Auth, Tenant, Invitations, Billing). All routes are **Next.js App Router Server Actions** or traditional `route.ts` handlers.*

---

## Conventions

| Property | Value |
|----------|-------|
| Base URL | `/api` |
| Auth     | Supabase JWT (cookie `sb:token`) |
| Content‑Type | `application/json` |
| Error shape | `{ error: string; code: string; details?: unknown }` |
| Validation | Zod schemas (see below) |

---

## 1 — Authentication

### 1.1 Register  
`POST /api/auth/register`

| Field | Type | Rule |
|-------|------|------|
| `email` | `string` | valid email |
| `password` | `string` | min 8 chars, 1 uppercase, 1 digit |

**Request (Zod)**  
```ts
import { z } from 'zod';
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'one uppercase')
    .regex(/[0-9]/, 'one digit'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;
```

**Response 200** – Creates **User** + **Tenant**  
```ts
export const RegisterResponseSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  emailSent: z.boolean(),   // verification email
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
```

---

### 1.2 Login  
`POST /api/auth/login`

```ts
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
```

---

### 1.3 Forgot Password  
`POST /api/auth/forgot-password`

```ts
export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});
export const ForgotPasswordResponseSchema = z.object({
  emailSent: z.boolean(),
});
```

---

### 1.4 Reset Password  
`POST /api/auth/reset-password`

```ts
export const ResetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});
export const ResetPasswordResponseSchema = z.object({
  success: z.boolean(),
});
```

---

## 2 — Tenants

### 2.1 Create Tenant  
`POST /api/tenants`

```ts
export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(50),
});
export const CreateTenantResponseSchema = z.object({
  tenantId: z.string().uuid(),
});
```

### 2.2 List Tenants (current user)  
`GET /api/tenants`

Response schema :  
```ts
export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
});
export const TenantsResponseSchema = z.array(TenantSchema);
```

---

## 3 — Invitations

### 3.1 Invite Member  
`POST /api/tenants/:tenantId/invitations`

```ts
export const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'BILLING_ADMIN']),
});
export const InviteResponseSchema = z.object({
  invitationId: z.string().uuid(),
  emailSent: z.boolean(),
});
```

### 3.2 Accept Invite  
`POST /api/invitations/accept`

```ts
export const AcceptInviteSchema = z.object({
  token: z.string().uuid(),
  password: z.string().optional(), // if user needs to set pw
});
export const AcceptInviteResponseSchema = z.object({
  tenantId: z.string().uuid(),
  role: z.string(),
  accessToken: z.string(),
});
```

---

## 4 — Billing & Stripe

### 4.1 Checkout Session  
`POST /api/billing/checkout`

```ts
export const CheckoutSchema = z.object({
  tenantId: z.string().uuid(),
  plan: z.enum(['PRO', 'ENTERPRISE']),
  seats: z.number().int().positive(),
});
export const CheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
});
```

### 4.2 Stripe Webhook  
`POST /api/stripe/webhook`

Handled via Stripe CLI signature. No explicit Zod (raw body).  
Events traités : `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`.

---

## 5 — Common Error Schema

```ts
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
```

---

## 6 — Implementation Notes

* **Validation** : Chaque Server Action commence par `schema.parse(params)` pour throw `ZodError` (422).  
* **Type Inference** : `type RegisterInput = z.infer<typeof RegisterSchema>;` évite duplication.  
* **OpenAPI** : Pouvons générer automatique via [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) si besoin.  
* **Rate Limiting** : Middleware wraps `/api/auth/*` à 5 req/min IP.  
* **RBAC Guard** : Route handlers décorés par `withRole(['OWNER'])` où requis.

---

> **Next :** Ajouter des tests Jest qui importent ces schemas et valident des fixtures request/response.