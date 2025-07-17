# Product Readiness Roadmap – Next.js SaaS Starter

Ce document résume **toutes les étapes** pour transformer le boilerplate en produit SaaS **production‑ready**.

---

## 1. Pré‑requis Environnement

| Outil | Version conseillée | Rôle |
|-------|-------------------|------|
| **Node.js** | ≥ 20 LTS | Runtime JS |
| **pnpm** | ≥ 8 | Gestion des paquets |
| **PostgreSQL** | 15 (via Supabase) | Base multi‑tenant |
| **Supabase CLI** | derniere | Migrations & RLS |
| **Prisma CLI** | 5.x | ORM type‑safe |
| **Stripe CLI** | 1.x | Test webhooks |
| **Vercel CLI** | 35+ | Deploy front |
| **Playwright** | 1.44 | E2E headless |

---

## 2. Setup Local

1. `pnpm install`  
2. Copier `.env.example` → `.env`  
3. Lancer Supabase local (`supabase start`) **ou** connexion au projet cloud.  
4. `pnpm prisma migrate dev --name init`  
5. `pnpm dev`  
6. `pnpm db:seed` (script `scripts/seed.ts`) pour la démo **Acme Inc.**

---

## 3. Flux Authentification

| Flow | Chemin Feature | Étapes techniques |
|------|---------------|-------------------|
| **Register** | `features/auth/register` | Server Action → `supabase.auth.signUp()` → Prisma user & tenant → Email de vérif (React Email). |
| **Login** | `features/auth/login` | Récupération JWT Supabase + set cookies. |
| **Forgot Password** | `features/auth/forgot-password` | `supabase.auth.resetPasswordForEmail()` + e‑mail magic‑link. |
| **Email Verification** | Listener Supabase `onAuthStateChange` ou webhook Edge. |

---

## 4. Multi‑Tenant & RBAC

1. **Tables** : `Tenant`, `Membership`, `Invitation`, `Subscription`.  
2. **RLS** : `tenant_id = auth.jwt().tenant_id`.  
3. **Roles internes** : `OWNER`, `ADMIN`, `MEMBER`, `BILLING_ADMIN`.  
4. **Invitations** : Server Action `inviteUser` + email token + accept/decline.

---

## 5. Billing Stripe

1. Créer produits & plans (Free, Pro, Enterprise seat‑based).  
2. Implémenter page **Checkout** (redirect Stripe).  
3. Webhook `api/stripe/webhook.ts` → mettre à jour `Subscription`.  
4. Accès aux features : middleware RBAC + `plan` gating.  
5. **Grace period** & **seats** gestion : cron Edge Function.

---

## 6. Email Transactionnel (React Email)

| Template | Fichier | Déclencheur |
|----------|---------|-------------|
| Verification | `emails/VerificationEmail.tsx` | Signup |
| Invitation | `emails/InviteEmail.tsx` | Team invite |
| Reset Password | `emails/ResetPassword.tsx` | Forgot password |
| Billing Receipt | `emails/InvoicePaid.tsx` | Stripe webhook |

Utiliser **Resend** ou `@supabase/functions` + SendGrid.

---

## 7. Qualité & Tests

* **Unit** (Jest) – logique pure, helpers Supabase.  
* **Integration** (Jest + Supabase test‑container) – RLS, Server Actions.  
* **E2E** (Playwright) – register → invite → checkout flow.  
* **Coverage goal** ≥ 90 %.  
* GitHub Actions matrix Node 18/20 + Playwright trace upload.

---

## 8. CI/CD & Infrastructure

1. **GitHub Actions** :  
   * Lint + Type check  
   * Tests  
   * Build et upload artefacts  
   * Déploiement Vercel “Preview” pour chaque PR  
2. **Vercel Prod** – promotion manuelle via label.  
3. Supabase migrations appliquées via `supabase db push`.  
4. Canary flag (header `x-canary-user`) pour progressive rollout.

---

## 9. Observabilité & Sécurité

| Domaine | Outil | Implémentation |
|---------|-------|---------------|
| **Logs** | Pino → Logflare | Edge & Node |
| **Metrics** | Prometheus via Vercel Integration | p95 latency |
| **Errors** | Sentry | Server & client |
| **Security** | OWASP scan, Dependabot | CI gate |
| **Backups** | Supabase point‑in‑time recovery | Daily |

---

## 10. Checklist Go‑Live

- [ ] Domaine custom configuré sur Vercel  
- [ ] Variables d’environnement production renseignées  
- [ ] Webhooks Stripe & Supabase sécurisés (signature)  
- [ ] Politiques RLS revues & testées  
- [ ] Plans Stripe actifs et visibles  
- [ ] Monitoring & alerting seuils définis  
- [ ] Pages légales : CGU, Politique privacy, Pricing  
- [ ] Test charge (k6, 1000 tenants) OK  
- [ ] Backup & recovery documenté  

---

> **Tip** : Chaque section correspond à un “epic” Jira / Linear.  
> Utilise ce fichier comme **source unique de vérité** pour suivre l’avancement du SaaS starter.