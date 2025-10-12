# Plan de Tests - SaaS Fast

## 📋 Vue d'ensemble

Ce document décrit tous les tests à implémenter pour les features, actions et hooks du projet SaaS Fast. L'objectif est d'atteindre une couverture de test complète pour toutes les fonctionnalités critiques.

## 🎯 Couverture actuelle

### ✅ Tests existants

- **auth/login** : `LoginForm.test.tsx`, `useLoginForm.test.ts`
- **shared/hooks** : `useAction.test.ts`, `useFormAction.test.ts`, `useFormActionWithFiles.test.ts`, `useToastError.test.ts`

### ❌ Tests manquants

- **Actions** : 14/15 non testées (93.3%)
- **Hooks** : 7/8 non testés (87.5%)

---

## 🔐 Authentification

### 1. auth/register

#### 📄 Actions à tester

**Fichier** : `features/auth/register/actions/register.action.ts`

**Fonctionnalités** :

- ✅ Validation des données (email, password, full_name)
- ✅ Création de compte Supabase avec metadata
- ✅ Gestion des erreurs (email déjà utilisé, erreurs réseau)
- ✅ Normalisation des messages d'erreur (sécurité)
- ✅ Redirection avec message de succès
- ✅ Configuration emailRedirectTo

**Tests à implémenter** :

```typescript
// register.action.test.ts
describe("registerAction", () => {
  it("should create account successfully");
  it("should handle invalid form data");
  it("should handle duplicate email error");
  it("should handle supabase auth errors");
  it("should redirect with success message");
  it("should include full_name in user metadata");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/auth/register/hooks/useRegisterForm.ts`

**Fonctionnalités** :

- ✅ Configuration du formulaire avec Zod resolver
- ✅ Valeurs par défaut (full_name, email, password)
- ✅ Intégration avec useFormAction
- ✅ Gestion des états (loading, actionState)

**Tests à implémenter** :

```typescript
// useRegisterForm.test.ts
describe("useRegisterForm", () => {
  it("should initialize form with correct default values");
  it("should use registerSchema for validation");
  it("should pass registerAction to useFormAction");
  it("should handle loading state");
  it("should handle successful registration");
  it("should handle registration errors");
});
```

### 2. auth/forgot-password

#### 📄 Actions à tester

**Fichier** : `features/auth/forgot-password/actions/forgotPassword.action.ts`

**Fonctionnalités** :

- ✅ Validation email
- ✅ Envoi email de réinitialisation
- ✅ Configuration redirectTo
- ✅ Gestion sécurisée (même message pour email inexistant)
- ✅ Redirection avec message de succès

**Tests à implémenter** :

```typescript
// forgotPassword.action.test.ts
describe("forgotPasswordAction", () => {
  it("should send reset email successfully");
  it("should handle invalid email format");
  it("should show same message for non-existent email");
  it("should handle supabase errors gracefully");
  it("should redirect with success message");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/auth/forgot-password/hooks/useForgotPasswordForm.ts`

**Fonctionnalités** :

- ✅ Configuration formulaire avec email uniquement
- ✅ État de succès (isSuccess)
- ✅ Effet sur actionState pour mettre à jour isSuccess
- ✅ Intégration useFormAction

**Tests à implémenter** :

```typescript
// useForgotPasswordForm.test.ts
describe("useForgotPasswordForm", () => {
  it("should initialize with email default value");
  it("should handle success state changes");
  it("should reset success state on error");
  it("should use forgotPasswordAction");
});
```

### 3. auth/reset-password

#### 📄 Actions à tester

**Fichier** : `features/auth/reset-password/actions/resetPassword.action.ts`

**Fonctionnalités** :

- ✅ Validation nouveau mot de passe
- ✅ Mise à jour mot de passe Supabase
- ✅ Gestion erreurs de mise à jour
- ✅ Redirection vers dashboard après succès

**Tests à implémenter** :

```typescript
// resetPassword.action.test.ts
describe("resetPasswordAction", () => {
  it("should update password successfully");
  it("should handle invalid password format");
  it("should handle supabase update errors");
  it("should redirect to dashboard on success");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/auth/reset-password/hooks/useResetPasswordForm.ts`

**Fonctionnalités** :

- ✅ Configuration formulaire password uniquement
- ✅ Validation avec resetPasswordSchema
- ✅ Intégration useFormAction standard

**Tests à implémenter** :

```typescript
// useResetPasswordForm.test.ts
describe("useResetPasswordForm", () => {
  it("should initialize with password default value");
  it("should use resetPasswordSchema for validation");
  it("should integrate with useFormAction");
});
```

### 4. auth/oauth

#### 📄 Actions à tester

**Fichiers** :

- `features/auth/login/actions/githubAuth.action.ts`
- `features/auth/login/actions/googleAuth.action.ts`

**Fonctionnalités** :

- ✅ Configuration OAuth provider
- ✅ RedirectTo avec callback URL
- ✅ Gestion erreurs OAuth
- ✅ Redirection vers URL OAuth ou page d'erreur

**Tests à implémenter** :

```typescript
// githubAuth.action.test.ts
describe("signInWithGithub", () => {
  it("should initiate GitHub OAuth flow");
  it("should handle OAuth errors");
  it("should redirect to OAuth URL on success");
  it("should use correct callback URL");
});

// googleAuth.action.test.ts
describe("signInWithGoogle", () => {
  it("should initiate Google OAuth flow");
  it("should handle OAuth errors");
  it("should redirect to OAuth URL on success");
  it("should use correct callback URL");
});
```

### 5. auth/shared

#### 📄 Actions à tester

**Fichier** : `features/auth/shared/actions/getUserTenantData.action.ts`

**Fonctionnalités** :

- ✅ `getInitialUserTenantData()` - Récupération données initiales
- ✅ `getUserTenants()` - Liste des tenants utilisateur
- ✅ `requireTenantContext()` - Contexte requis avec redirections
- ✅ `requireTenantAccess()` - Vérification accès tenant
- ✅ `updateCurrentTenant()` - Changement tenant courant
- ✅ `refreshUserTenants()` - Rafraîchissement données
- ✅ `switchTenant()` - Changement de tenant

**Tests à implémenter** :

```typescript
// getUserTenantData.action.test.ts
describe("getInitialUserTenantData", () => {
  it("should return null for unauthenticated user");
  it("should return user data with tenants");
  it("should handle user without profile");
  it("should set current tenant correctly");
});

describe("getUserTenants", () => {
  it("should return user tenants with permissions");
  it("should calculate isOwner and isAdmin correctly");
  it("should return empty array for user without tenants");
});

describe("requireTenantContext", () => {
  it("should redirect unauthenticated users");
  it("should redirect users without profile");
  it("should redirect users without tenants");
  it("should return valid context");
});

describe("switchTenant", () => {
  it("should switch tenant successfully");
  it("should validate tenant access");
  it("should handle invalid tenant ID");
});
```

---

## 🏢 Gestion des Tenants

### 1. tenant/create

#### 📄 Actions à tester

**Fichier** : `features/tenant/create/actions/createTenant.action.ts`

**Fonctionnalités** :

- ✅ Validation nom du tenant
- ✅ Vérification authentification utilisateur
- ✅ Transaction : création tenant + membership OWNER + mise à jour profil
- ✅ Gestion erreurs de création

**Tests à implémenter** :

```typescript
// createTenant.action.test.ts
describe("createTenantAction", () => {
  it("should create tenant successfully");
  it("should validate tenant name");
  it("should require authenticated user");
  it("should create owner membership");
  it("should update user current tenant");
  it("should handle database errors");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/tenant/create/hooks/useCreateTenantForm.ts`

**Fonctionnalités** :

- ✅ Configuration formulaire avec validation nom
- ✅ État de succès avec reset du formulaire
- ✅ Rafraîchissement des tenants via useUser
- ✅ Intégration useFormAction

**Tests à implémenter** :

```typescript
// useCreateTenantForm.test.ts
describe("useCreateTenantForm", () => {
  it("should initialize form with empty name");
  it("should handle successful creation");
  it("should reset form on success");
  it("should refresh tenants on success");
  it("should handle creation errors");
});
```

### 2. tenant/delete

#### 📄 Actions à tester

**Fichier** : `features/tenant/delete/actions/deleteTenant.action.ts`

**Fonctionnalités** :

- ✅ Validation ID tenant
- ✅ Vérification propriétaire du tenant
- ✅ Vérification pas le dernier tenant
- ✅ Soft delete + désactivation memberships
- ✅ Changement tenant courant si nécessaire

**Tests à implémenter** :

```typescript
// deleteTenant.action.test.ts
describe("deleteTenantAction", () => {
  it("should delete tenant successfully");
  it("should require owner permission");
  it("should prevent deleting last tenant");
  it("should soft delete tenant");
  it("should switch current tenant if needed");
  it("should handle database errors");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/tenant/delete/hooks/useDeleteTenant.ts`

**Fonctionnalités** :

- ✅ Utilisation useAction pour deleteTenantAction
- ✅ Rafraîchissement tenants après suppression
- ✅ Fonction helper deleteTenant(tenantId)

**Tests à implémenter** :

```typescript
// useDeleteTenant.test.ts
describe("useDeleteTenant", () => {
  it("should delete tenant by ID");
  it("should refresh tenants on success");
  it("should handle deletion errors");
  it("should manage loading state");
});
```

### 3. tenant/invite

#### 📄 Actions à tester

**Fichiers** :

- `features/tenant/invite/actions/invite.action.ts`
- `features/tenant/invite/actions/accept.action.ts`

**Fonctionnalités invite.action** :

- ✅ Validation email et rôle
- ✅ Vérification permissions (OWNER/ADMIN)
- ✅ Gestion invitations existantes (idempotent)
- ✅ Génération token sécurisé
- ✅ Expiration 7 jours

**Fonctionnalités accept.action** :

- ✅ Validation token et expiration
- ✅ Vérification authentification
- ✅ Correspondance email invitation
- ✅ Création/mise à jour membership
- ✅ Marquage invitation acceptée

**Tests à implémenter** :

```typescript
// invite.action.test.ts
describe("inviteMemberAction", () => {
  it("should create invitation successfully");
  it("should require admin permissions");
  it("should update existing invitation");
  it("should generate secure token");
  it("should set 7-day expiration");
});

// accept.action.test.ts
describe("acceptInvitationAction", () => {
  it("should accept valid invitation");
  it("should reject expired invitation");
  it("should require authentication");
  it("should validate email match");
  it("should create membership");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/tenant/invite/hooks/useInviteForm.ts`

**Fonctionnalités** :

- ✅ Configuration formulaire email + rôle
- ✅ Rôle par défaut MEMBER
- ✅ Reset formulaire après succès
- ✅ État de succès

**Tests à implémenter** :

```typescript
// useInviteForm.test.ts
describe("useInviteForm", () => {
  it("should initialize with default role MEMBER");
  it("should reset form on successful invite");
  it("should handle invite success state");
  it("should validate email format");
});
```

### 4. tenant/members

#### 📄 Actions à tester

**Fichiers** :

- `features/tenant/members/actions/list.action.ts`
- `features/tenant/members/actions/remove-member.action.ts`
- `features/tenant/members/actions/update-role.action.ts`

**Fonctionnalités list.action** :

- ✅ Récupération membres actifs avec scoping tenant
- ✅ Récupération invitations en attente
- ✅ Jointure avec profils utilisateurs

**Fonctionnalités remove-member.action** :

- ✅ Vérification permissions OWNER/ADMIN
- ✅ Protection contre suppression OWNER par non-OWNER
- ✅ Protection dernier OWNER
- ✅ Soft delete (status REMOVED)

**Fonctionnalités update-role.action** :

- ✅ Vérification permissions pour changement rôle
- ✅ Protection modification OWNER par non-OWNER
- ✅ Protection promotion OWNER par non-OWNER

**Tests à implémenter** :

```typescript
// list.action.test.ts
describe("getTeamMembersAction", () => {
  it("should return team members with scoping");
  it("should return pending invitations");
  it("should join with user profiles");
});

// remove-member.action.test.ts
describe("removeMemberAction", () => {
  it("should remove member successfully");
  it("should require admin permissions");
  it("should protect owner removal");
  it("should prevent last owner removal");
});

// update-role.action.test.ts
describe("updateMemberRoleAction", () => {
  it("should update role successfully");
  it("should require admin permissions");
  it("should protect owner role changes");
  it("should prevent non-owner promotion to owner");
});
```

---

## ⚙️ Paramètres Compte

### 1. account/settings

#### 📄 Actions à tester

**Fichier** : `features/account/settings/actions/updateAccountSettings.action.ts`

**Fonctionnalités** :

- ✅ Validation données compte (nom)
- ✅ Upload avatar vers Supabase Storage
- ✅ Validation fichier (type, taille 1MB)
- ✅ Suppression ancien avatar
- ✅ Mise à jour profil utilisateur

**Tests à implémenter** :

```typescript
// updateAccountSettings.action.test.ts
describe("updateAccountSettingsAction", () => {
  it("should update account name successfully");
  it("should upload avatar to storage");
  it("should validate file type and size");
  it("should delete old avatar");
  it("should handle upload errors");
  it("should require authentication");
});
```

#### 🎣 Hooks à tester

**Fichier** : `features/account/settings/hooks/useAccountSettingsForm.ts`

**Fonctionnalités** :

- ✅ Configuration formulaire avec données initiales
- ✅ Gestion fichier avatar (sélection, preview, validation)
- ✅ Utilisation useFormActionWithFiles
- ✅ Toast de succès et refresh router
- ✅ Validation côté client (type, taille)

**Tests à implémenter** :

```typescript
// useAccountSettingsForm.test.ts
describe("useAccountSettingsForm", () => {
  it("should initialize with user data");
  it("should handle file selection");
  it("should validate file type and size");
  it("should generate preview URL");
  it("should show success toast");
  it("should refresh router on success");
});
```

---

## 🛠️ Stratégie d'implémentation

### Phase 1 : Authentification (Priorité haute)

1. ✅ `auth/register` - Feature critique
2. ✅ `auth/forgot-password` - Sécurité
3. ✅ `auth/reset-password` - Sécurité
4. ✅ `auth/oauth` - Fonctionnalité populaire
5. ✅ `auth/shared` - Actions centrales

### Phase 2 : Gestion Tenants (Priorité haute)

1. ✅ `tenant/create` - Feature core
2. ✅ `tenant/delete` - Feature core
3. ✅ `tenant/invite` - Collaboration
4. ✅ `tenant/members` - Gestion équipe

### Phase 3 : Paramètres (Priorité moyenne)

1. ✅ `account/settings` - Profil utilisateur

## 📊 Métriques cibles

- **Couverture Actions** : 100% (15/15)
- **Couverture Hooks** : 100% (8/8)
- **Tests par feature** : 5-8 tests minimum
- **Temps d'exécution** : < 30s pour toute la suite

## 🧪 Patterns de test

### Actions

```typescript
// Mock Supabase et DB
vi.mock("@/shared/db/supabase/server");
vi.mock("@/shared/db/drizzle/db");

// Test structure standard
describe("actionName", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should handle success case");
  it("should validate input data");
  it("should handle errors");
  it("should require authentication");
});
```

### Hooks

```typescript
// Mock dependencies
vi.mock("@/shared/hooks/useFormAction");
vi.mock("react-hook-form");

// Test structure standard
describe("useHookName", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should initialize correctly");
  it("should handle form submission");
  it("should manage loading state");
  it("should handle success/error states");
});
```

---

_Ce document sera mis à jour au fur et à mesure de l'implémentation des tests._
