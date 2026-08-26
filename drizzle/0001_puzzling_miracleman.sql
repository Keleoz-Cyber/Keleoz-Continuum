CREATE TYPE "public"."letter_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."letter_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postal_code" varchar(6) NOT NULL,
	"sender_name" varchar(120),
	"content" text NOT NULL,
	"visibility" "letter_visibility" DEFAULT 'private' NOT NULL,
	"status" "letter_status" DEFAULT 'pending' NOT NULL,
	"owner_reply" text,
	"source_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "letters_postal_code_unique" UNIQUE("postal_code")
);
--> statement-breakpoint
CREATE INDEX "letters_status_visibility_idx" ON "letters" USING btree ("status","visibility");--> statement-breakpoint
CREATE INDEX "letters_created_at_idx" ON "letters" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "letters_source_hash_idx" ON "letters" USING btree ("source_hash");