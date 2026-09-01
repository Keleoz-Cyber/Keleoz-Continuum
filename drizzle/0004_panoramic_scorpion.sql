CREATE TABLE "content_media" (
	"entry_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_media_entry_media_pk" PRIMARY KEY("entry_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "media_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"name" varchar(40) NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_objects" ADD COLUMN "sha256" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "media_objects" ADD COLUMN "alt_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "persona_reviews" ADD COLUMN "media_object_id" uuid;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_media_id_media_objects_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_media_id_media_objects_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_media_entry_position_idx" ON "content_media" USING btree ("entry_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "media_variants_media_name_unique" ON "media_variants" USING btree ("media_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "media_variants_storage_key_unique" ON "media_variants" USING btree ("storage_key");--> statement-breakpoint
ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_media_object_id_media_objects_id_fk" FOREIGN KEY ("media_object_id") REFERENCES "public"."media_objects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_objects_sha256_state_idx" ON "media_objects" USING btree ("sha256","state");