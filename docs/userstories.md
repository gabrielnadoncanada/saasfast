# User Stories & Acceptance Criteria

*Version: 1.0 – July 2025*

---

## Epic 1 — Authentication

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **AUTH‑1** | *As a visitor, I want to register with email & password so that I can access the app.* | 1. Given a valid email / strong password, an unverified **User** record is created.<br>2. A verification email is queued and sent within 60 s.<br>3. Response returns a 200 with auth session token.<br>4. Password stored as bcrypt hash.<br>5. Duplicate email triggers `409 Conflict`. |
| **AUTH‑2** | *As a visitor, I want to sign in with GitHub OAuth so that I can skip password creation.* | 1. Clicking “Sign in with GitHub” redirects to GitHub OAuth screen.<br>2. On successful callback, a **User** is created or fetched.<br>3. JWT cookie set, user lands on `/dashboard`.<br>4. Denied scopes shows meaningful error. |
| **AUTH‑3** | *As a user, I want to reset my password when I forget it.* | 1. Submitting email triggers `supabase.auth.resetPasswordForEmail`.<br>2. An email with time‑bound link (30 min expiry) is sent.<br>3. Visiting link shows reset form; strong password rules enforced.<br>4. On success, user is auto‑logged‑in. |
| **AUTH‑4** | *As a user, I want my email verified before accessing protected areas.* | 1. Unverified users hitting protected routes are redirected to `/verify`.<br>2. Clicking verification link sets `email_confirmed_at` in DB.<br>3. User is redirected to intended page. |

---

## Epic 2 — Multi‑Tenant & RBAC

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **TEN‑1** | *As a first‑time user, I want a tenant (account) auto‑created so I can start immediately.* | 1. After registration, a **Tenant** row is created with `ownerId = user.id`.<br>2. A **Membership** `OWNER` record exists for the user. |
| **TEN‑2** | *As an owner, I want to invite teammates by email so that we can collaborate.* | 1. Entering an email & role issues an **Invitation** with token (expiry 7 days).<br>2. Email “Join Acme Inc” sent via React Email.<br>3. Accepting token creates **User** (if new) + **Membership** with chosen role.<br>4. Duplicate pending invite replaced (idempotent). |
| **TEN‑3** | *As an admin, I want to change a member’s role.* | 1. Role selector shows only allowed upgrades/downgrades.<br>2. Update succeeds if requester `role in [OWNER, ADMIN]`.<br>3. RLS prevents updates from lower roles. |
| **TEN‑4** | *As any member, my data access must be isolated to my tenant.* | 1. Row‑level SELECT, INSERT, UPDATE enforced by `tenant_id = auth.jwt().tenant_id`.<br>2. Unit tests prove cross‑tenant read/write fails. |

---

## Epic 3 — Billing & Payments (Stripe)

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **BILL‑1** | *As an owner, I can upgrade to Pro plan via Stripe Checkout.* | 1. Clicking “Upgrade” opens Stripe Checkout with correct price ID.<br>2. On success, user returns to `/billing/success`.<br>3. Webhook `invoice.paid` marks subscription `active` and plan `PRO`. |
| **BILL‑2** | *As an owner, I want to manage payment details in Customer Portal.* | 1. “Manage billing” button opens Stripe Customer Portal session.<br>2. Changes propagate back via webhook events. |
| **BILL‑3** | *As the system, I must suspend Pro features when payment fails.* | 1. `invoice.payment_failed` sets subscription `past_due`.<br>2. Feature flag `isPro` becomes false after 3 day grace.<br>3. Resume payment re‑enables immediately. |
| **BILL‑4** | *As an owner, I pay per active seat.* | 1. Seat count = active memberships excluding `INVITED`.<br>2. Increasing seats triggers proration.<br>3. Decreasing seats effective next cycle. |

---

## Epic 4 — Transactional Emails

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **EMAIL‑1** | *Send verification email on registration.* | Template `VerificationEmail` rendered; link contains secure token; email sent <60 s. |
| **EMAIL‑2** | *Send invitation email to teammate.* | Template `InviteEmail`; personalises with `tenant.name`; token valid 7 days. |
| **EMAIL‑3** | *Send reset‑password email.* | Template `ResetPassword`; link expires 30 min; one email per request. |
| **EMAIL‑4** | *Send Stripe invoice paid receipt.* | Trigger on webhook `invoice.paid`; attaches PDF if available. |

---

## Epic 5 — Quality & Testing

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **TEST‑1** | *As a developer, I want unit tests to cover core logic ≥ 90 %.* | Jest reports `coverage >= 0.9` in CI; build fails otherwise. |
| **TEST‑2** | *As a developer, I want RLS integration tests.* | Test‑container spins Supabase; cross‑tenant queries return `permission denied`. |
| **TEST‑3** | *As a developer, I want E2E tests for happy path flows.* | Playwright script: register → invite → checkout; all assertions pass. |

---

## Epic 6 — CI/CD & Infrastructure

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **CI‑1** | *On each PR, I get a Vercel Preview URL.* | GitHub Action posts the URL in PR comment; build must pass lint, tests. |
| **CI‑2** | *On merge to `main`, production deploys automatically.* | CI pipeline builds & promotes artifact; downtime ≤ 30 s. |
| **CI‑3** | *Migrations run safely during deploy.* | `supabase db push` executes before Vercel promote; failures abort deploy. |

---

## Epic 7 — Observability & Security

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **OBS‑1** | *As an operator, I can view p95 latency dashboards.* | Prometheus & Grafana show real‑time p95 < 200 ms; alert if > 300 ms for 5 min. |
| **OBS‑2** | *As an operator, I receive error alerts in Slack.* | Sentry integration posts error summary within 1 min; includes stack trace. |
| **SEC‑1** | *Dependencies are scanned for vulnerabilities weekly.* | GH Dependabot PRs created automatically; critical CVEs fail CI. |
| **SEC‑2** | *Rate limiting protects public API routes.* | Exceeding 100 req/min/IP returns `429 Too Many Requests`. |

---

## Epic 8 — Go‑Live & Compliance

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **LIVE‑1** | *As PM, I want a go‑live checklist to be 100 % green before launch.* | All items in `prd.md` checklist marked done; sign‑off recorded. |
| **COMP‑1** | *As Data Protection Officer, I require GDPR compliance.* | DPA signed; Data residency option EU; Right‑to‑be‑forgotten scripted & tested. |

---

> **Note :** Les IDs servent de référence dans Jira / Linear. Chaque story doit avoir ses tâches techniques (FE, BE, tests, docs) liées.