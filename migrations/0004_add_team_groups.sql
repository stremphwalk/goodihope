-- Team Groups feature migration
-- Creates tables for temporary team collaboration

-- Table for team groups
CREATE TABLE "team_groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_by_user_id" integer NOT NULL REFERENCES "users"("id"),
  "invite_code" text NOT NULL UNIQUE,
  "created_at" timestamp DEFAULT now(),
  "expires_at" timestamp NOT NULL
);

-- Table for group membership
CREATE TABLE "group_members" (
  "id" serial PRIMARY KEY NOT NULL,
  "group_id" integer NOT NULL REFERENCES "team_groups"("id") ON DELETE CASCADE,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'member' NOT NULL,
  "joined_at" timestamp DEFAULT now(),
  UNIQUE("group_id", "user_id")
);

-- Table for group todos
CREATE TABLE "group_todos" (
  "id" serial PRIMARY KEY NOT NULL,
  "group_id" integer NOT NULL REFERENCES "team_groups"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "created_by_user_id" integer NOT NULL REFERENCES "users"("id"),
  "completed" boolean DEFAULT false,
  "completed_by_user_id" integer REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now(),
  "completed_at" timestamp
);

-- Table for group events
CREATE TABLE "group_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "group_id" integer NOT NULL REFERENCES "team_groups"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "event_date" timestamp NOT NULL,
  "created_by_user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX "idx_team_groups_invite_code" ON "team_groups"("invite_code");
CREATE INDEX "idx_team_groups_expires_at" ON "team_groups"("expires_at");
CREATE INDEX "idx_group_members_group_id" ON "group_members"("group_id");
CREATE INDEX "idx_group_members_user_id" ON "group_members"("user_id");
CREATE INDEX "idx_group_todos_group_id" ON "group_todos"("group_id");
CREATE INDEX "idx_group_todos_completed" ON "group_todos"("completed");
CREATE INDEX "idx_group_events_group_id" ON "group_events"("group_id");
CREATE INDEX "idx_group_events_event_date" ON "group_events"("event_date");