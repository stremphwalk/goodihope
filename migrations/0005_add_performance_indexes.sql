-- Add performance indexes for group dashboard queries

-- Index for efficient todo ordering within groups
CREATE INDEX IF NOT EXISTS idx_group_todos_group_status_position 
ON group_todos (group_id, status, position);

-- Index for efficient member lookups
CREATE INDEX IF NOT EXISTS idx_group_members_group_user 
ON group_members (group_id, user_id);

-- Index for efficient event queries
CREATE INDEX IF NOT EXISTS idx_group_events_group_date 
ON group_events (group_id, event_date);

-- Index for user lookups in todos (covers creator, completer, assignee)
CREATE INDEX IF NOT EXISTS idx_group_todos_user_refs 
ON group_todos (created_by_user_id, completed_by_user_id, assigned_to_user_id);

-- Composite index for todo status changes and assignments
CREATE INDEX IF NOT EXISTS idx_group_todos_status_assignments 
ON group_todos (group_id, status, assigned_to_user_id, position);