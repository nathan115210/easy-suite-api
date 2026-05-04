CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snacks', 'dessert', 'drinks');--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"image" text NOT NULL,
	"description" text NOT NULL,
	"cook_time" integer,
	"difficulty" "difficulty_level",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "meal_instructions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"image" text,
	"text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meal_id" uuid NOT NULL,
	"text" text NOT NULL,
	"amount" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_nutrition" (
	"meal_id" uuid PRIMARY KEY NOT NULL,
	"calories" integer NOT NULL,
	"protein" integer,
	"carbs" integer,
	"fat" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_types" (
	"meal_id" uuid NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_types_meal_id_meal_type_pk" PRIMARY KEY("meal_id","meal_type")
);
--> statement-breakpoint
CREATE TABLE "meal_tags" (
	"meal_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_tags_meal_id_tag_id_pk" PRIMARY KEY("meal_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "meal_instructions" ADD CONSTRAINT "meal_instructions_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_nutrition" ADD CONSTRAINT "meal_nutrition_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_types" ADD CONSTRAINT "meal_types_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_tags" ADD CONSTRAINT "meal_tags_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_tags" ADD CONSTRAINT "meal_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meals_title_fts_idx" ON "meals" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "meals_difficulty_idx" ON "meals" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "meals_cook_time_idx" ON "meals" USING btree ("cook_time");--> statement-breakpoint
CREATE INDEX "meals_created_at_idx" ON "meals" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "meal_instructions_meal_id_idx" ON "meal_instructions" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_instructions_meal_sort_idx" ON "meal_instructions" USING btree ("meal_id","sort_order");--> statement-breakpoint
CREATE INDEX "meal_ingredients_meal_id_idx" ON "meal_ingredients" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_ingredients_meal_sort_idx" ON "meal_ingredients" USING btree ("meal_id","sort_order");--> statement-breakpoint
CREATE INDEX "meal_types_meal_id_idx" ON "meal_types" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_types_type_idx" ON "meal_types" USING btree ("meal_type");--> statement-breakpoint
CREATE INDEX "meal_tags_meal_id_idx" ON "meal_tags" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "meal_tags_tag_id_idx" ON "meal_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "meal_tags_meal_sort_idx" ON "meal_tags" USING btree ("meal_id","sort_order");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");