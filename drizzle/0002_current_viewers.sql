CREATE TABLE "room_viewers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "room_viewers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"room_slug" text NOT NULL,
	"viewer_key" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"is_authenticated" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_viewers_room_slug_viewer_key_unique" UNIQUE("room_slug","viewer_key")
);
--> statement-breakpoint
CREATE INDEX "room_viewers_room_slug_last_seen_idx" ON "room_viewers" USING btree ("room_slug","last_seen_at");