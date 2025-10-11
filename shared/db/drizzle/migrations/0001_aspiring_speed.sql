DROP INDEX "tenants_email_idx";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "businessName";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "website";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "address";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "postalCode";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "taxId";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "vatNumber";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "registrationNumber";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "timezone";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "industry";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "description";