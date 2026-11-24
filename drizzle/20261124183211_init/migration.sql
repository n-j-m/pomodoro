CREATE TABLE "session_routines" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"steps" jsonb NOT NULL,
	"repeat_indefinitley" boolean DEFAULT true NOT NULL,
	"auto_advance" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"task" text,
	"routine_id" integer,
	"step_label" text NOT NULL,
	"category" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_routine_id_session_routines_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "session_routines"("id") ON DELETE SET NULL;