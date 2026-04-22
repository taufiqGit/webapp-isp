CREATE TABLE "tax" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tax_code_uq" ON "tax" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_name_uq" ON "tax" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tax_createdAt_idx" ON "tax" USING btree ("created_at");