--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" uuid NOT NULL,
	"actorId" uuid,
	"action" varchar(255) NOT NULL,
	"target" varchar(255) NOT NULL,
	"meta" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"tenantId" uuid NOT NULL,
	"role" "Role" NOT NULL,
	"status" "MembershipStatus" DEFAULT 'ACTIVE' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_userId_tenantId_key" UNIQUE("userId","tenantId")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"avatarUrl" varchar(500),
	"currentTenantId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"ownerId" uuid NOT NULL,
	"stripeCustomerId" varchar(255),
	"plan" "Plan" DEFAULT 'FREE' NOT NULL,
	"businessName" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(255),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postalCode" varchar(20),
	"country" varchar(100),
	"taxId" varchar(50),
	"vatNumber" varchar(50),
	"registrationNumber" varchar(50),
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC',
	"currency" varchar(3) DEFAULT 'USD',
	"industry" varchar(100),
	"description" text,
	"logoUrl" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "tenants_stripeCustomerId_unique" UNIQUE("stripeCustomerId")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "Role" NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"acceptedAt" timestamp,
	CONSTRAINT "invitations_token_unique" UNIQUE("token"),
	CONSTRAINT "invitations_tenantId_email_key" UNIQUE("tenantId","email")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenantId" uuid NOT NULL,
	"stripeSubId" varchar(255) NOT NULL,
	"plan" "Plan" NOT NULL,
	"seats" integer DEFAULT 1 NOT NULL,
	"status" "SubscriptionStatus" NOT NULL,
	"currentPeriodEnd" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_tenantId_unique" UNIQUE("tenantId"),
	CONSTRAINT "subscriptions_stripeSubId_unique" UNIQUE("stripeSubId")
);
--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_actorId_profiles_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_profiles_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_ownerId_profiles_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_tenants_id_fk" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auditLogs_tenantId_createdAt_idx" ON "auditLogs" USING btree ("tenantId","createdAt");--> statement-breakpoint
CREATE INDEX "memberships_tenantId_role_idx" ON "memberships" USING btree ("tenantId","role");--> statement-breakpoint
CREATE INDEX "memberships_userId_status_idx" ON "memberships" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "tenants_ownerId_idx" ON "tenants" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "tenants_email_idx" ON "tenants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_expiresAt_idx" ON "invitations" USING btree ("expiresAt");