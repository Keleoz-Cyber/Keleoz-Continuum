CREATE TABLE "operation_settings" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"guest_ai_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
