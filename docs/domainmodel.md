# Domain Model – Prisma Schema Blueprint

Cette vue d’ensemble définit **toutes les entités persistance** nécessaires pour le SaaS starter.  
Chaque table inclut : clef primaire, colonnes, contraintes, relations, indexes, et description métier.

> **Notation**  
> • `PK` = Primary Key • `FK` = Foreign Key • `UQ` = Unique • `NN` = Not‑Null • `?` = Nullable

---

## 1. `User`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `String` | `PK` (UUID, default `uuid()`) | Identifiant utilisateur |
| `email` | `String` | `UQ`, `NN` | Email de connexion |
| `hashedPassword` | `String` | Nullable | Hash Bcrypt, null si OAuth |
| `name` | `String` | Optionnel | Nom affiché |
| `avatarUrl` | `String` | Optionnel | URL avatar |
| `emailConfirmedAt` | `DateTime` | Nullable | Vérification email |
| `createdAt` | `DateTime` | Default `now()` | Timestamp création |
| **Relations** |  |  |  |
| `memberships` | `[Membership]` |  | Liens tenant‑user |
| `ownedTenants` | `[Tenant]` |  | Tenants créés |

**Indexes** : `(email)` unique

---

## 2. `Tenant`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `String` | `PK` (UUID) | Identifiant organisation |
| `name` | `String` | `NN` | Nom affiché |
| `ownerId` | `String` | `FK -> User.id` | Propriétaire |
| `stripeCustomerId` | `String` | `UQ`, Nullable | Lien Stripe Customer |
| `plan` | `String` | Default `'FREE'` | FREE / PRO / ENTERPRISE |
| `createdAt` | `DateTime` | Default `now()` | Timestamp création |
| `deletedAt` | `DateTime` | Nullable | Soft‑delete |
| **Relations** |  |  |  |
| `memberships` | `[Membership]` |  | Membres |
| `invitations` | `[Invitation]` |  | Invites |
| `subscription` | `Subscription?` |  | Abonnement Stripe |

**Indexes** : `(ownerId)`

---

## 3. `Membership`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `String` | `PK` | |
| `userId` | `String` | `FK -> User.id` | |
| `tenantId` | `String` | `FK -> Tenant.id` | |
| `role` | `String` | `NN` | OWNER / ADMIN / MEMBER / BILLING_ADMIN |
| `status` | `String` | Default `'ACTIVE'` | ACTIVE / INVITED / REMOVED |
| `createdAt` | `DateTime` | Default `now()` | |

**Composite Index** : `UQ(userId, tenantId)`

---

## 4. `Invitation`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `String` | `PK` | |
| `tenantId` | `String` | `FK -> Tenant.id` | |
| `email` | `String` | `NN` | |
| `role` | `String` | `NN` | ADMIN / MEMBER / BILLING_ADMIN |
| `token` | `String` | `UQ` | Token signé |
| `expiresAt` | `DateTime` | `NN` | Expiration |
| `createdAt` | `DateTime` | Default `now()` | |
| `acceptedAt` | `DateTime` | Nullable | Date acceptation |

**Index** : `(tenantId, email)` unique (évite doublons)

---

## 5. `Subscription`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `String` | `PK` | |
| `tenantId` | `String` | `FK`, `UQ` | 1‑to‑1 tenant |
| `stripeSubId` | `String` | `UQ` | Id Stripe Subscription |
| `plan` | `String` | `NN` | PRO / ENTERPRISE |
| `seats` | `Int` | Default `1` | Nombre de membres payés |
| `status` | `String` | `NN` | INCOMPLETE / ACTIVE / PAST_DUE / CANCELED |
| `currentPeriodEnd` | `DateTime` | `NN` | Fin de cycle |
| `createdAt` | `DateTime` | Default `now()` | |

---

## 6. `AuditLog`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `String` | `PK` | |
| `tenantId` | `String` | `FK -> Tenant.id` | |
| `actorId` | `String` | Nullable `FK -> User.id` | Peut être system |
| `action` | `String` | `NN` | ex. `USER_INVITED` |
| `target` | `String` | `NN` | Ressource ciblée |
| `meta` | `Json` | Nullable | Données additionnelles |
| `createdAt` | `DateTime` | Default `now()` | |

**Index** : `(tenantId, createdAt desc)`

---

## 7. Enum Definitions

```prisma
enum Role {
  OWNER
  ADMIN
  MEMBER
  BILLING_ADMIN
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  INCOMPLETE
  ACTIVE
  PAST_DUE
  CANCELED
}

enum MembershipStatus {
  ACTIVE
  INVITED
  REMOVED
}
```

---

## 8. Relation Diagram _(simplifié)_

```
User (1)───<Membership>(*)───(1)Tenant
   │                         │
  (1)                         > Invitation(*)
   │
  (1)───<AuditLog>(*)
Tenant (1)───Subscription(1)
```

---

### Guidance for Prisma Implementation

* Utiliser `@@index` & `@@unique` pour correspondre aux indexes ci‑dessus.  
* Les enums PRISMA = camelCase optionnel mais garder UPPER_SNAKE pour clarté SQL.  
* Ajouter `map("...")` si vous avez besoin de noms d’index explicites pour Supabase.  
* Chaque table doit inclure un champ `tenantId` **si** les données doivent être isolées (AuditLog, Membership, etc.).  
* Activer les **Row‑Level Security** avec la politique `tenant_id = auth.jwt().tenant_id`.