CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"speed_mbps" integer NOT NULL,
	"price_monthly" integer NOT NULL,
	"tax_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_tax_id_tax_id_fk" FOREIGN KEY ("tax_id") REFERENCES "public"."tax"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_code_uq" ON "plan" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_name_uq" ON "plan" USING btree ("name");--> statement-breakpoint
CREATE INDEX "plan_speedMbps_idx" ON "plan" USING btree ("speed_mbps");--> statement-breakpoint
CREATE INDEX "plan_priceMonthly_idx" ON "plan" USING btree ("price_monthly");--> statement-breakpoint
CREATE INDEX "plan_isActive_idx" ON "plan" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "plan_taxId_idx" ON "plan" USING btree ("tax_id");