CREATE TYPE "public"."content_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('blog', 'project', 'moment', 'page');--> statement-breakpoint
CREATE TYPE "public"."exposure" AS ENUM('full', 'summary', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."media_state" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "login_throttles" (
	"fingerprint_hash" varchar(64) PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 0 NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owners_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" varchar(64) PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "content_type" NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(240) NOT NULL,
	"subtitle" varchar(320),
	"category_label" varchar(120),
	"summary" text DEFAULT '' NOT NULL,
	"exposure" "exposure" DEFAULT 'full' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"draft_document" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"draft_html" text DEFAULT '' NOT NULL,
	"draft_plain_text" text DEFAULT '' NOT NULL,
	"draft_revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_entries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_publications" (
	"entry_id" uuid PRIMARY KEY NOT NULL,
	"version_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_publications_version_id_unique" UNIQUE("version_id")
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"slug" varchar(160) NOT NULL,
	"type" "content_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"subtitle" varchar(320),
	"category_label" varchar(120),
	"summary" text DEFAULT '' NOT NULL,
	"exposure" "exposure" NOT NULL,
	"document" jsonb NOT NULL,
	"rendered_html" text NOT NULL,
	"plain_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"byte_size" integer NOT NULL,
	"state" "media_state" DEFAULT 'pending' NOT NULL,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_objects_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_version_id_content_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."content_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_owner_id_idx" ON "sessions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "content_entries_type_status_idx" ON "content_entries" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "content_publications_version_id_idx" ON "content_publications" USING btree ("version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_versions_entry_version_unique" ON "content_versions" USING btree ("entry_id","version_number");--> statement-breakpoint
CREATE INDEX "content_versions_entry_id_idx" ON "content_versions" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "media_objects_state_idx" ON "media_objects" USING btree ("state");