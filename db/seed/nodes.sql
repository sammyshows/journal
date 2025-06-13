-- Seed data for nodes table
-- Sample nodes that might be extracted from journal entries

INSERT INTO nodes (node_id, label, type, user_id, created_at, updated_at) 
SELECT 
  node_id,
  label,
  type,
  '123e4567-e89b-12d3-a456-426614174000',
  '2025-06-04 10:00:00.000000',
  '2025-06-04 10:00:00.000000'
FROM (VALUES
  ('self-reflection', 'theme', '123e4567-e89b-12d3-a456-426614170001'::uuid),
  ('social connection', 'theme', '123e4567-e89b-12d3-a456-426614170002'::uuid),
  ('positive mood', 'emotion', '123e4567-e89b-12d3-a456-426614170003'::uuid),
  ('organization', 'theme', '123e4567-e89b-12d3-a456-426614170004'::uuid),
  ('partner', 'person', '123e4567-e89b-12d3-a456-426614170005'::uuid),
  ('argument', 'event', '123e4567-e89b-12d3-a456-426614170006'::uuid),
  ('kids', 'entity', '123e4567-e89b-12d3-a456-426614170007'::uuid),
  ('schedules', 'theme', '123e4567-e89b-12d3-a456-426614170008'::uuid),
  ('Kanye', 'person', '123e4567-e89b-12d3-a456-426614170009'::uuid),
  ('music', 'theme', '123e4567-e89b-12d3-a456-426614170010'::uuid),
  ('rap', 'genre', '123e4567-e89b-12d3-a456-426614170011'::uuid),
  ('50 Cent', 'person', '123e4567-e89b-12d3-a456-426614170012'::uuid),
  ('Eminem', 'person', '123e4567-e89b-12d3-a456-426614170013'::uuid),
  ('Jay Z', 'person', '123e4567-e89b-12d3-a456-426614170014'::uuid),
  ('Kendrick', 'person', '123e4567-e89b-12d3-a456-426614170015'::uuid),
  ('country music', 'genre', '123e4567-e89b-12d3-a456-426614170016'::uuid),
  ('family', 'relationship', '123e4567-e89b-12d3-a456-426614170017'::uuid),
  ('brother', 'person', '123e4567-e89b-12d3-a456-426614170018'::uuid),
  ('farmer', 'occupation', '123e4567-e89b-12d3-a456-426614170019'::uuid),
  ('career', 'theme', '123e4567-e89b-12d3-a456-426614170020'::uuid),
  ('AI', 'theme', '123e4567-e89b-12d3-a456-426614170021'::uuid),
  ('epiphany', 'event', '123e4567-e89b-12d3-a456-426614170022'::uuid),
  ('idea development', 'process', '123e4567-e89b-12d3-a456-426614170023'::uuid),
  ('motivation', 'emotion', '123e4567-e89b-12d3-a456-426614170024'::uuid),
  ('physical therapy', 'theme', '123e4567-e89b-12d3-a456-426614170025'::uuid),
  ('self-doubt', 'emotion', '123e4567-e89b-12d3-a456-426614170026'::uuid),
  ('expectations', 'theme', '123e4567-e89b-12d3-a456-426614170027'::uuid),
  ('running', 'theme', '123e4567-e89b-12d3-a456-426614170028'::uuid),
  ('work-life balance', 'theme', '123e4567-e89b-12d3-a456-426614170029'::uuid),
  ('colleague', 'person', '123e4567-e89b-12d3-a456-426614170030'::uuid)
) AS seed_nodes(label, type, node_id)
ON CONFLICT (label, type, user_id) DO NOTHING;