CREATE TYPE "public"."persona_review_action" AS ENUM('post', 'comment', 'reply', 'repost');--> statement-breakpoint
CREATE TYPE "public"."persona_review_status" AS ENUM('pending', 'approved', 'rejected', 'deleted');--> statement-breakpoint
CREATE TABLE "moment_authorships" (
	"entry_id" uuid PRIMARY KEY NOT NULL,
	"persona_id" uuid NOT NULL,
	"repost_of_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moment_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"persona_id" uuid NOT NULL,
	"parent_comment_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moment_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"handle" varchar(80) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"system_prompt" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"can_post" boolean DEFAULT false NOT NULL,
	"can_comment" boolean DEFAULT false NOT NULL,
	"can_repost" boolean DEFAULT false NOT NULL,
	"can_use_images" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persona_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"action" "persona_review_action" NOT NULL,
	"status" "persona_review_status" DEFAULT 'pending' NOT NULL,
	"target_entry_id" uuid,
	"target_comment_id" uuid,
	"content" text NOT NULL,
	"image_prompt" text,
	"reviewed_content" text,
	"published_entry_id" uuid,
	"published_comment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "moment_authorships" ADD CONSTRAINT "moment_authorships_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_authorships" ADD CONSTRAINT "moment_authorships_persona_id_moment_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."moment_personas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_authorships" ADD CONSTRAINT "moment_authorships_repost_of_entry_id_content_entries_id_fk" FOREIGN KEY ("repost_of_entry_id") REFERENCES "public"."content_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_entry_id_content_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."content_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_persona_id_moment_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."moment_personas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_persona_id_moment_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."moment_personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_target_entry_id_content_entries_id_fk" FOREIGN KEY ("target_entry_id") REFERENCES "public"."content_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_reviews" ADD CONSTRAINT "persona_reviews_published_entry_id_content_entries_id_fk" FOREIGN KEY ("published_entry_id") REFERENCES "public"."content_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moment_authorships_persona_idx" ON "moment_authorships" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "moment_comments_entry_created_idx" ON "moment_comments" USING btree ("entry_id","created_at");--> statement-breakpoint
CREATE INDEX "moment_comments_parent_idx" ON "moment_comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "moment_personas_handle_unique" ON "moment_personas" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "persona_reviews_status_created_idx" ON "persona_reviews" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "persona_reviews_persona_created_idx" ON "persona_reviews" USING btree ("persona_id","created_at");