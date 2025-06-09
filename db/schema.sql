-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable uuid extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- User profiles table
CREATE TABLE users (
  user_id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- Will link to Supabase auth when implemented
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE journal_entries (
  journal_entry_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Foreign key to users.user_id
  content TEXT NOT NULL,
  embedding vector(1024), -- Voyage-3-large produces 1024-dimensional vectors
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- Store additional context (voice transcription confidence, etc.)
  
  -- Add index for user queries and vector similarity search
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Vector similarity search index (using cosine distance)
CREATE INDEX idx_journal_entries_embedding ON journal_entries USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();