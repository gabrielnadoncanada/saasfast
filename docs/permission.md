# Permission Model & Supabase RLS Policies

*Purpose :* Formaliser les **rôles applicatifs** et la traduction en **politiques Row‑Level Security** (RLS) Postgres/Supabase.

---

## 1. Rôles Fonctionnels

| Role | Description | Capacités clés |
|------|-------------|----------------|
| **OWNER** | Fondateur / super‑admin du tenant. | • CRUD complet sur tous les objets<br>• Gestion des plans & paiement<br>• Gestion des membres & rôles<br>• Suppression du tenant |
| **ADMIN** | Admin technique ou produit. | • CRUD objets métier<br>• Inviter / retirer membres<br>• Modifier rôles (`MEMBER`, `BILLING_ADMIN`)<br>• Pas accès facturation |
| **BILLING_ADMIN** | Responsable financier. | • Lire objets métier<br>• Gérer plan, checkout, sièges<br>• Pas de gestion des rôles |
| **MEMBER** | Utilisateur standard. | • Lire / créer / mettre à jour ses propres données<br>• Pas de gestion équipe ni billing |
| **INVITED** | Statut temporaire avant acceptation. | • Action unique : accepter invitation |

> Les rôles app sont stockés dans `Membership.role` (enum `Role`).  
> Ils peuvent être propagés dans le JWT Supabase via claims personnalisés pour simplifier les checks.

---

## 2. Vue d’ensemble Permissions (CRUD)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **User** | `OWNER`, `ADMIN`, `MEMBER` (self) | App interne | Self (avatar, name) | Self (hard delete disabled) |
| **Tenant** | Membres du tenant | `OWNER` auto | `OWNER` / `ADMIN` (`name`) | `OWNER` |
| **Membership** | Tous membres du tenant | `OWNER` / `ADMIN` | `OWNER` / `ADMIN` (role) | `OWNER` / self leave |
| **Invitation** | `OWNER` / `ADMIN` | `OWNER` / `ADMIN` | `OWNER` / `ADMIN` | `OWNER` / `ADMIN` |
| **Subscription** | Membres (read) | Stripe webhook | Stripe webhook, `BILLING_ADMIN`, `OWNER` | Stripe event |
| **AuditLog** | Membres | System only | - | - |

---

## 3. Setup Supabase : Helpers SQL

```sql
-- 1. Activer RLS (une fois)
alter table "public"."User" enable row level security;
alter table "public"."Tenant" enable row level security;
-- idem pour chaque table ...

-- 2. Function utilitaire : vérifie membership & rôle minimal
create or replace function public.has_role(min_roles text[])
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from "Membership"
    where "userId" = auth.uid()
      and "tenantId" = current_setting('request.jwt.claims', true)::json->>'tenant_id'
      and "role" = any(min_roles)
  );
$$;

-- 3. Function utilitaire : vérifie l'appartenance au tenant
create or replace function public.same_tenant(row_tenant uuid)
returns boolean
language sql stable
as $$
  select row_tenant = (
    current_setting('request.jwt.claims', true)::json->>'tenant_id'
  )::uuid;
$$;
```

---

## 4. Politiques RLS exemples

### Table `Tenant`

```sql
-- Lecture : tous les membres
create policy "Tenant members can read"
on "Tenant"
for select
using (public.same_tenant(id));

-- Update : seulement OWNER & ADMIN
create policy "Only owner/admin can update tenant"
on "Tenant"
for update
using (
  public.same_tenant(id)
  and public.has_role(array['OWNER','ADMIN'])
);

-- Delete : OWNER uniquement
create policy "Only owner can delete tenant"
on "Tenant"
for delete
using (
  public.same_tenant(id)
  and public.has_role(array['OWNER'])
);
```

### Table `Membership`

```sql
-- Read : membres
create policy "Members read membership"
on "Membership"
for select
using (public.same_tenant("tenantId"));

-- Insert : OWNER / ADMIN
create policy "Owner/Admin create membership"
on "Membership"
for insert
with check (
  public.same_tenant("tenantId") and public.has_role(array['OWNER','ADMIN'])
);

-- Update Role : OWNER / ADMIN
create policy "Owner/Admin update role"
on "Membership"
for update
using (public.same_tenant("tenantId") and public.has_role(array['OWNER','ADMIN']));
```

### Table `Invitation`

```sql
create policy "Owner/Admin manage invitations"
on "Invitation"
for all
using (
  public.same_tenant("tenantId") and public.has_role(array['OWNER','ADMIN'])
)
with check (
  public.same_tenant("tenantId") and public.has_role(array['OWNER','ADMIN'])
);
```

### Table `Subscription`

```sql
-- Lectures : membres
create policy "Members read subscription"
on "Subscription"
for select
using (public.same_tenant("tenantId"));

-- Update : Stripe webhook (service rôle) OU Billing/Admin
create policy "Billing admin update subscription"
on "Subscription"
for update
using (
  auth.role() = 'service_role'  -- server‑side key
  or (public.same_tenant("tenantId") and public.has_role(array['OWNER','BILLING_ADMIN']))
);
```

---

## 5. JWT Claims Exemple (Supabase Auth)

Lors du login (Edge Function `onAuth` ou middleware), enrichir le JWT :

```ts
const claims = {
  tenant_id: membership.tenantId,
  role: membership.role,          // OWNER, ADMIN…
};
const { session } = await supabase.auth.updateUser({ data: claims });
```

Ainsi, les politiques RLS peuvent directement lire `auth.jwt()->>'role'` ou `tenant_id`.

---

## 6. Migrations via Supabase CLI

1. Ajouter les fonctions & politiques dans `supabase/migrations/<timestamp>_rls.sql`.  
2. `supabase db push` pour appliquer en local.  
3. GitHub Action exécute la même commande contre `SUPABASE_DB_URL` prod.

---

> **Tip :** Toujours créer un **test Jest** par table pour valider “Cross‑tenant read/write forbidden”.