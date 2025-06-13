-- Seed data for edges table
-- Sample relationships between nodes

-- Get node IDs for seeding
WITH node_ids AS (
  SELECT node_id, label, type FROM nodes WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
)

INSERT INTO edges (edge_id, from_node_id, to_node_id, weight, source_entry_id, user_id, timestamps, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  from_node.node_id,
  to_node.node_id,
  weight,
  (SELECT journal_entry_id FROM journal_entries LIMIT 1),
  '123e4567-e89b-12d3-a456-426614174000',
  ARRAY['2025-06-04 10:00:00.000000+00'::timestamptz, '2025-06-04 14:00:00.000000+00'::timestamptz],
  '2025-06-04 10:00:00.000000',
  '2025-06-04 10:00:00.000000'
FROM (VALUES
  ('motivation', 'emotion', 'physical therapy', 'theme', 0.8),
  ('expectations', 'theme', 'motivation', 'emotion', -0.6),
  ('self-doubt', 'emotion', 'motivation', 'emotion', -0.4),
  ('physical therapy', 'theme', 'running', 'theme', 0.6),
  ('self-doubt', 'emotion', 'career', 'theme', 0.7),
  ('epiphany', 'event', 'AI', 'theme', -0.6),
  ('epiphany', 'event', 'idea development', 'process', 0.9),
  ('music', 'theme', 'rap', 'genre', 0.8),
  ('music', 'theme', 'country music', 'genre', 0.6),
  ('rap', 'genre', '50 Cent', 'person', 0.9),
  ('rap', 'genre', 'Eminem', 'person', 0.8),
  ('rap', 'genre', 'Jay Z', 'person', 0.8),
  ('rap', 'genre', 'Kanye', 'person', 0.8),
  ('rap', 'genre', 'Kendrick', 'person', 0.8),
  ('country music', 'genre', 'family', 'relationship', 0.7),
  ('country music', 'genre', 'brother', 'person', 0.8),
  ('brother', 'person', 'farmer', 'occupation', 0.9),
  ('partner', 'person', 'argument', 'event', 0.7),
  ('argument', 'event', 'organization', 'theme', 0.6),
  ('schedules', 'theme', 'argument', 'event', 0.8),
  ('kids', 'entity', 'argument', 'event', 0.7),
  ('kids', 'entity', 'organization', 'theme', 0.6),
  ('social connection', 'theme', 'positive mood', 'emotion', 0.8),
  ('self-reflection', 'theme', 'positive mood', 'emotion', 0.7),
  ('self-doubt', 'emotion', 'work-life balance', 'theme', 0.6),
  ('colleague', 'person', 'self-doubt', 'emotion', 0.7)
) AS seed_edges(from_label, from_type, to_label, to_type, weight)
JOIN node_ids from_node ON from_node.label = seed_edges.from_label AND from_node.type = seed_edges.from_type
JOIN node_ids to_node ON to_node.label = seed_edges.to_label AND to_node.type = seed_edges.to_type;


--------------------------------
-- Use this to get the edges  --
--------------------------------
-- WITH first_user AS (
--   SELECT user_id FROM users LIMIT 1
-- ),
-- node_ids AS (
--   SELECT node_id, label, type FROM nodes WHERE user_id = (SELECT user_id FROM first_user)
-- ),
-- first_entry AS (
--   SELECT journal_entry_id FROM journal_entries LIMIT 1
-- )
-- SELECT
--   from_node.label AS from_label,
--   from_node.type AS from_type,
--   to_node.label AS to_label,
--   to_node.type AS to_type,
--   e.weight
-- FROM edges e
-- JOIN node_ids from_node ON from_node.node_id = e.from_node_id
-- JOIN node_ids to_node ON to_node.node_id = e.to_node_id;