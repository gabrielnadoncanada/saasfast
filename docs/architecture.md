# Architecture & Conventions

*Version 1.0 – July 2025*

Ce document donne la vue « 30 000 ft » du starter SaaS et décrit **où** et **comment** un agent de génération de code doit placer chaque nouvelle fonctionnalité.

---

## 1. Vue Macro (Mermaid)

```mermaid
graph TD
  subgraph Frontend (Next.js App Router)
    A[Pages /app/**] --> B[Server Actions]
    A --> C[Client Components]
    C -->|supabase-js| D[(Supabase API)]
  end

  subgraph Backend
    B --> E[Prisma Client]
    E --> F[(Postgres + RLS)]
    F -->|Edge Functions| G[Supabase Auth & Webhooks]
    G --> H[Stripe Webhook Handler]
  end

  subgraph External
    H --> I[Stripe]
    G --> J[Resend / Email Provider]
  end
```

---

## 2. Dossier Racine (FSD)

| Layer        | Path prefix      | Contenu typique | Règles de nommage |
|--------------|------------------|-----------------|-------------------|
| **App**      | `app/`           | Routes App Router, `layout.tsx`, Server Actions génériques | routes kebab‑case |
| **Features** | `features/<area>`| Formulaires, actions serveur, hooks spécifiques (Ex : `features/auth/login`) | PascalCase composants, camelCase hooks |
| **Entities** | `entities/<name>`| Modèles métier réutilisables (`entities/user`) | snake‑case fichiers Prisma |
| **Shared**   | `shared/`        | Design system ShadCN, libs utilitaires (Supabase, Prisma) | Aucune logique métier |
| **Emails**   | `emails/`        | Templates React Email, 1 fichier = 1 template | CamelCase |
| **Scripts**  | `scripts/`       | Seeders, maintenance jobs | `something.ts` |
| **Tests**    | `tests/`         | Jest & Playwright | Miroir des features |

---

## 3. Flux de Données

| Step | Description | Fichiers cibles |
|------|-------------|-----------------|
| **1. Form** | Collecte input utilisateur (React Client) | `features/.../Form.tsx` |
| **2. Server Action** | Validation (Zod) → appel Prisma/Supabase | `features/.../actions.ts` |
| **3. DB** | ORM `prisma.<model>.<op>()` | `entities/*/repository.ts` (si abstraction) |
| **4. Side‑Effects** | Email, Stripe, Log, Audit | Utilitaires dans `shared/lib/*` |
| **5. Response** | JSON ou redirect vers route | Server Action retourne `NextResponse` |

---

## 4. Règles de Code Généré

1. **Types d’abord :** toujours référencer les Zod schemas de `specsapi.md`.  
2. **Aucune mutation cross‑tenant** sans passer par `tenantId` check + RLS.  
3. **Nom des Server Actions** : `<verb><Entity>Action` (`createInvoiceAction`).  
4. **Tests obligatoires** : chaque action → test unité + éventuel E2E si flux critique.  
5. **Taille fichier :** max 350 lignes (conforme note FSD).  
6. **Pas de logique UI ** dans actions, pas de logique métier dans components ShadCN.

---

## 5. JWT Claims & Middlewares

* Middleware `middleware.ts` lit `auth.jwt().role` & `tenant_id` → redirige si accès interdit.  
* Claims injectés via Edge Function post‑signup (cf. `permission.md`).  

---

## 6. Pipeline CI/CD (résumé)

```yaml
# .github/workflows/ci.yml
jobs:
  build:
    steps:
      - pnpm install
      - pnpm lint && pnpm test
      - pnpm prisma generate
      - pnpm build
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - vercel deploy --prod
```

---

## 7. Extension par un Agent

1. **Lire :** `userstories.md` pour cibler une story (ID ex : AUTH‑2).  
2. **Chercher :** `specsapi.md` pour payloads / validations.  
3. **Coder :**  
   * Créer dossier `features/<area>/<story>` si nouveau.  
   * Implémenter Zod schema, form, server action, tests.  
4. **Mettre à jour :**  
   * `domainmodel.md` si nouvelle table → migration Prisma.  
   * `permission.md` si nouvelles RLS.  
5. **Valider :** lancer `pnpm test` + `pnpm prisma db pull` + local E2E.  
6. **Commit :** respecter `contributing.md` (si présent) puis push → PR ↔ CI.

---

> Ce fichier est le **pivot** entre vision fonctionnelle et implémentation.  
> Tout agent ou développeur doit le lire avant d’étendre le starter.