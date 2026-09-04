CREATE TYPE "public"."owner_auto_memory_priority" AS ENUM('always', 'normal', 'low');--> statement-breakpoint
CREATE TYPE "public"."owner_chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."owner_memory_visibility" AS ENUM('public', 'only', 'except', 'private');--> statement-breakpoint
CREATE TABLE "owner_auto_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companion_id" uuid NOT NULL,
	"category" varchar(40) NOT NULL,
	"priority" "owner_auto_memory_priority" DEFAULT 'normal' NOT NULL,
	"content" text NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"updated_by" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_chat_companions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"system_prompt" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"memory_enabled" boolean DEFAULT true NOT NULL,
	"auto_memory_enabled" boolean DEFAULT true NOT NULL,
	"auto_memory_mode" varchar(20) DEFAULT 'hybrid' NOT NULL,
	"auto_memory_budget" integer DEFAULT 1200 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" "owner_chat_role" NOT NULL,
	"content" text NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"auto_memory_events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"companion_id" uuid NOT NULL,
	"title" varchar(160) DEFAULT 'New conversation' NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(240) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"one_line" text DEFAULT '' NOT NULL,
	"domain" varchar(80) DEFAULT '日常' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"valence" double precision DEFAULT 0.5 NOT NULL,
	"arousal" double precision DEFAULT 0.3 NOT NULL,
	"importance" integer DEFAULT 5 NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"visibility" "owner_memory_visibility" DEFAULT 'public' NOT NULL,
	"visible_to" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclude_from" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activation_count" integer DEFAULT 0 NOT NULL,
	"last_activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_companion_id" uuid,
	"created_by_name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "owner_auto_memories" ADD CONSTRAINT "owner_auto_memories_companion_id_owner_chat_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."owner_chat_companions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_chat_messages" ADD CONSTRAINT "owner_chat_messages_thread_id_owner_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."owner_chat_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_chat_threads" ADD CONSTRAINT "owner_chat_threads_companion_id_owner_chat_companions_id_fk" FOREIGN KEY ("companion_id") REFERENCES "public"."owner_chat_companions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_memories" ADD CONSTRAINT "owner_memories_created_by_companion_id_owner_chat_companions_id_fk" FOREIGN KEY ("created_by_companion_id") REFERENCES "public"."owner_chat_companions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "owner_auto_memories_companion_created_idx" ON "owner_auto_memories" USING btree ("companion_id","created_at");--> statement-breakpoint
CREATE INDEX "owner_chat_messages_thread_created_idx" ON "owner_chat_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "owner_chat_threads_companion_updated_idx" ON "owner_chat_threads" USING btree ("companion_id","updated_at");--> statement-breakpoint
CREATE INDEX "owner_memories_created_idx" ON "owner_memories" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "owner_memories_domain_idx" ON "owner_memories" USING btree ("domain");