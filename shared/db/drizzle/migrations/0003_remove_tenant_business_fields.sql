-- Migration pour supprimer les champs business du tenant
-- Ces informations seront gérées dans des entités séparées si nécessaire

-- Supprimer les colonnes non essentielles
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "businessName";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "email";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "phone";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "website";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "address";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "city";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "state";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "postalCode";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "country";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "taxId";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "vatNumber";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "registrationNumber";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "language";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "timezone";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "currency";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "industry";
ALTER TABLE public.tenants DROP COLUMN IF EXISTS "description";

-- Supprimer l'index sur email qui n'existe plus
DROP INDEX IF EXISTS tenants_email_idx;
