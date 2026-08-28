CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature" varchar(32) NOT NULL,
	"source_hash" varchar(64) NOT NULL,
	"session_id" uuid NOT NULL,
	"status" varchar(24) DEFAULT 'reserved' NOT NULL,
	"provider" varchar(80) NOT NULL,
	"model" varchar(160) NOT NULL,
	"input_characters" integer NOT NULL,
	"output_characters" integer DEFAULT 0 NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"reserved_cost_micro_usd" integer NOT NULL,
	"provider_request_id" varchar(160),
	"error_code" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "ai_usage_source_feature_created_idx" ON "ai_usage_events" USING btree ("source_hash","feature","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_session_created_idx" ON "ai_usage_events" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage_events" USING btree ("created_at");