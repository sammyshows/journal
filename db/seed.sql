-- Seed data for Journal AI development and testing

-- Insert test user profile
INSERT INTO user_profiles (user_id, name, reflection_preferences, emotional_patterns) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Test User', 
 '{"preferred_prompt_style": "gentle", "voice_enabled": true}',
 '{"common_emotions": ["reflection", "gratitude", "anxiety"], "peak_journaling_time": "evening"}'
);

-- Insert sample journal entries with mock embeddings
INSERT INTO journal_entries (user_id, content, embedding, metadata) VALUES
('123e4567-e89b-12d3-a456-426614174000', 
 'Today I watched The Four Seasons on Netflix and it really made me think about the humanity in people. There''s something beautiful about how the show captures the complexity of human emotions and relationships.',
 -- Mock embedding vector (1024 dimensions of random values for testing)
 array_fill(0.1, ARRAY[1024])::vector,
 '{"source": "web_chat", "session_id": "test_session_1"}'
),

('123e4567-e89b-12d3-a456-426614174000',
 'I''ve been feeling overwhelmed with work lately. The deadlines keep piling up and I''m struggling to find balance. Maybe I need to step back and reassess my priorities.',
 array_fill(0.2, ARRAY[1024])::vector,
 '{"source": "web_chat", "session_id": "test_session_2"}'
),

('123e4567-e89b-12d3-a456-426614174000',
 'Had a wonderful call with my parents today. It reminded me how important it is to stay connected with family, even when life gets busy. Feeling grateful for their support.',
 array_fill(0.3, ARRAY[1024])::vector,
 '{"source": "voice", "transcription_confidence": 0.95}'
),

('123e4567-e89b-12d3-a456-426614174000',
 'Starting to think about what I want to accomplish this year. I feel like I''ve been drifting without clear goals. Time to get intentional about my personal growth.',
 array_fill(0.4, ARRAY[1024])::vector,
 '{"source": "web_chat", "session_id": "test_session_3"}'
);

-- Link emotions to entries
INSERT INTO entry_emotions (entry_id, emotion_id, intensity) VALUES
-- Entry 1: Netflix reflection - contemplation, curiosity
(1, (SELECT id FROM emotions WHERE name = 'contemplation'), 0.8),
(1, (SELECT id FROM emotions WHERE name = 'curiosity'), 0.6),

-- Entry 2: Work overwhelm - anxiety, overwhelm, frustration  
(2, (SELECT id FROM emotions WHERE name = 'anxiety'), 0.9),
(2, (SELECT id FROM emotions WHERE name = 'overwhelm'), 0.8),
(2, (SELECT id FROM emotions WHERE name = 'frustration'), 0.7),

-- Entry 3: Family call - gratitude, love, peace
(3, (SELECT id FROM emotions WHERE name = 'gratitude'), 0.9),
(3, (SELECT id FROM emotions WHERE name = 'love'), 0.8),
(3, (SELECT id FROM emotions WHERE name = 'peace'), 0.7),

-- Entry 4: Goal setting - reflection, curiosity
(4, (SELECT id FROM emotions WHERE name = 'reflection'), 0.8),
(4, (SELECT id FROM emotions WHERE name = 'curiosity'), 0.6);

-- Link topics to entries  
INSERT INTO entry_topics (entry_id, topic_id, relevance) VALUES
-- Entry 1: Netflix reflection
(1, (SELECT id FROM topics WHERE name = 'personal_growth'), 0.7),
(1, (SELECT id FROM topics WHERE name = 'creativity'), 0.5),

-- Entry 2: Work overwhelm
(2, (SELECT id FROM topics WHERE name = 'work'), 0.9),
(2, (SELECT id FROM topics WHERE name = 'health'), 0.6),

-- Entry 3: Family call
(3, (SELECT id FROM topics WHERE name = 'family'), 0.9),
(3, (SELECT id FROM topics WHERE name = 'relationships'), 0.8),

-- Entry 4: Goal setting
(4, (SELECT id FROM topics WHERE name = 'personal_growth'), 0.9),
(4, (SELECT id FROM topics WHERE name = 'work'), 0.4);