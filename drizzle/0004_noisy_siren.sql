ALTER TABLE "products" ADD COLUMN "original_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "occasion" json;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "longevity" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "projection" text;