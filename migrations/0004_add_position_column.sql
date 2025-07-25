-- Add position column for task ordering within status columns
ALTER TABLE group_todos ADD COLUMN position INTEGER DEFAULT 0 NOT NULL;

-- Set initial positions based on creation order within each status
UPDATE group_todos 
SET position = subquery.row_num - 1
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY group_id, status ORDER BY created_at) as row_num
  FROM group_todos
) AS subquery
WHERE group_todos.id = subquery.id;