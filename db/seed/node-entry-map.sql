-- Seed data for node_entry_map table
-- Maps nodes to journal entries to track which concepts appear in which entries

INSERT INTO node_entry_map (node_entry_map_id, node_id, entry_id, user_id, created_at)
SELECT 
  gen_random_uuid(),
  node_id,
  entry_id,
  '123e4567-e89b-12d3-a456-426614174000',
  '2025-06-04 10:00:00.000000'
FROM (VALUES
  -- Work-life balance/colleague theme (journal_entry_id: 9c3f59f5-7696-4e45-96b8-d8bbca9cdb9e)
  ('123e4567-e89b-12d3-a456-426614170029'::uuid, '9c3f59f5-7696-4e45-96b8-d8bbca9cdb9e'::uuid), -- work-life balance
  ('123e4567-e89b-12d3-a456-426614170030'::uuid, '9c3f59f5-7696-4e45-96b8-d8bbca9cdb9e'::uuid), -- colleague,
  ('123e4567-e89b-12d3-a456-426614170026'::uuid, '9c3f59f5-7696-4e45-96b8-d8bbca9cdb9e'::uuid), -- self-doubt
  
  -- Physical therapy/running theme (journal_entry_id: 0793519f-056f-4777-8f0d-07c81440b0f2)
  ('123e4567-e89b-12d3-a456-426614170026'::uuid, '0793519f-056f-4777-8f0d-07c81440b0f2'::uuid), -- self-doubt
  ('123e4567-e89b-12d3-a456-426614170024'::uuid, '0793519f-056f-4777-8f0d-07c81440b0f2'::uuid), -- motivation
  ('123e4567-e89b-12d3-a456-426614170025'::uuid, '0793519f-056f-4777-8f0d-07c81440b0f2'::uuid), -- physical therapy
  ('123e4567-e89b-12d3-a456-426614170028'::uuid, '0793519f-056f-4777-8f0d-07c81440b0f2'::uuid), -- running
  ('123e4567-e89b-12d3-a456-426614170027'::uuid, '0793519f-056f-4777-8f0d-07c81440b0f2'::uuid), -- expectations
  
  -- Career/AI theme (journal_entry_id: 526d9a7e-7067-423c-9bc1-f257af73efb8)
  ('123e4567-e89b-12d3-a456-426614170026'::uuid, '526d9a7e-7067-423c-9bc1-f257af73efb8'::uuid), -- self-doubt
  ('123e4567-e89b-12d3-a456-426614170020'::uuid, '526d9a7e-7067-423c-9bc1-f257af73efb8'::uuid), -- career
  ('123e4567-e89b-12d3-a456-426614170022'::uuid, '526d9a7e-7067-423c-9bc1-f257af73efb8'::uuid), -- epiphany
  ('123e4567-e89b-12d3-a456-426614170021'::uuid, '526d9a7e-7067-423c-9bc1-f257af73efb8'::uuid), -- AI
  ('123e4567-e89b-12d3-a456-426614170023'::uuid, '526d9a7e-7067-423c-9bc1-f257af73efb8'::uuid), -- idea development
  
  -- Music/rap theme (journal_entry_id: 84c34195-b142-4516-9b3b-096191821661)
  ('123e4567-e89b-12d3-a456-426614170010'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- music
  ('123e4567-e89b-12d3-a456-426614170011'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- rap
  ('123e4567-e89b-12d3-a456-426614170012'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- 50 Cent
  ('123e4567-e89b-12d3-a456-426614170013'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- Eminem
  ('123e4567-e89b-12d3-a456-426614170014'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- Jay Z
  ('123e4567-e89b-12d3-a456-426614170009'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- Kanye
  ('123e4567-e89b-12d3-a456-426614170015'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- Kendrick
  ('123e4567-e89b-12d3-a456-426614170016'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- country music
  ('123e4567-e89b-12d3-a456-426614170017'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- family
  ('123e4567-e89b-12d3-a456-426614170018'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- brother
  ('123e4567-e89b-12d3-a456-426614170019'::uuid, '84c34195-b142-4516-9b3b-096191821661'::uuid), -- farmer
  
  -- Family/organization theme (journal_entry_id: 5ceeb164-b5d8-4f03-87ed-212afc2fa623)
  ('123e4567-e89b-12d3-a456-426614170005'::uuid, '5ceeb164-b5d8-4f03-87ed-212afc2fa623'::uuid), -- partner
  ('123e4567-e89b-12d3-a456-426614170006'::uuid, '5ceeb164-b5d8-4f03-87ed-212afc2fa623'::uuid), -- argument
  ('123e4567-e89b-12d3-a456-426614170004'::uuid, '5ceeb164-b5d8-4f03-87ed-212afc2fa623'::uuid), -- organization
  ('123e4567-e89b-12d3-a456-426614170008'::uuid, '5ceeb164-b5d8-4f03-87ed-212afc2fa623'::uuid), -- schedules
  ('123e4567-e89b-12d3-a456-426614170007'::uuid, '5ceeb164-b5d8-4f03-87ed-212afc2fa623'::uuid), -- kids
  
  -- Social/reflection theme (journal_entry_id: adf944f0-3734-40a0-80e8-bbf99259b835)
  ('123e4567-e89b-12d3-a456-426614170002'::uuid, 'adf944f0-3734-40a0-80e8-bbf99259b835'::uuid), -- social connection
  ('123e4567-e89b-12d3-a456-426614170001'::uuid, 'adf944f0-3734-40a0-80e8-bbf99259b835'::uuid), -- self-reflection
  ('123e4567-e89b-12d3-a456-426614170003'::uuid, 'adf944f0-3734-40a0-80e8-bbf99259b835'::uuid)  -- positive mood
) AS seed_mappings(node_id, entry_id)
ON CONFLICT (node_id, entry_id) DO NOTHING;