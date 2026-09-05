CREATE TABLE "owner_source_records" (
	"store" varchar(40) NOT NULL,
	"key" varchar(180) NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_source_records_store_key_pk" PRIMARY KEY("store","key")
);
