ALTER TABLE "products" ADD COLUMN "gender" text DEFAULT 'unisex' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_trending" boolean DEFAULT false;