CREATE TYPE "public"."customer_address_type" AS ENUM('billing', 'service', 'installation', 'other');--> statement-breakpoint
CREATE TYPE "public"."customer_identity_type" AS ENUM('ktp', 'sim', 'passport', 'npwp', 'other');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('prospect', 'active', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "public"."customer_subscription_status" AS ENUM('active', 'suspended', 'terminated');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_number" text NOT NULL,
	"type" "customer_type" DEFAULT 'individual' NOT NULL,
	"status" "customer_status" DEFAULT 'prospect' NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"identity_type" "customer_identity_type",
	"identity_number" text,
	"birth_date" date,
	"tax_id" text,
	"notes" text,
	"total_active_subscriptions" integer DEFAULT 0 NOT NULL,
	"next_payment_date" date,
	"total_subscription_cost" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_address" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"type" "customer_address_type" DEFAULT 'service' NOT NULL,
	"label" text,
	"line1" text NOT NULL,
	"line2" text,
	"village" text,
	"district" text,
	"city" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text,
	"country" text DEFAULT 'ID' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"package_id" text NOT NULL,
	"package_name" text NOT NULL,
	"status" "customer_subscription_status" DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"price_monthly" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_subscription" ADD CONSTRAINT "customer_subscription_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_customerNumber_uq" ON "customer" USING btree ("customer_number");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_email_uq" ON "customer" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_phone_idx" ON "customer" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "customer_status_idx" ON "customer" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_type_idx" ON "customer" USING btree ("type");--> statement-breakpoint
CREATE INDEX "customerAddress_customerId_idx" ON "customer_address" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customerAddress_type_idx" ON "customer_address" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "customerAddress_customerId_type_isPrimary_uq" ON "customer_address" USING btree ("customer_id","type","is_primary");--> statement-breakpoint
CREATE INDEX "customerSubscription_customerId_idx" ON "customer_subscription" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customerSubscription_customerId_status_idx" ON "customer_subscription" USING btree ("customer_id","status");