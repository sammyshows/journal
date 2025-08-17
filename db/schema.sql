-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;
-- Enable uuid extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
-- DROP TABLE IF EXISTS node_entry_map CASCADE;
-- DROP TABLE IF EXISTS edges CASCADE;
-- DROP TABLE IF EXISTS nodes CASCADE;
-- DROP TABLE IF EXISTS journal_entries CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- User profiles table
CREATE TABLE users (
  user_id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- Will link to Supabase auth when implemented
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE journal_entries (
  journal_entry_id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- Foreign key to users.user_id
  content TEXT NOT NULL,
  embedding vector(1024), -- Voyage-3-large produces 1024-dimensional vectors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- Store additional context (voice transcription confidence, etc.)
  title TEXT,
  emoji TEXT,
  user_summary TEXT,
  ai_summary TEXT,
  
  -- Add index for user queries and vector similarity search
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE journal_entry_tags (
  journal_entry_tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nodes: Core concepts/emotions/themes extracted from entries
CREATE TABLE nodes (
  node_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,           -- e.g. "self-doubt", "career"
  type TEXT NOT NULL,            -- e.g. "emotion", "theme", "person"
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE, -- Node is specific to user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(label, type, user_id)   -- Prevent duplicate concepts per user
);

-- Edges: Relationships between nodes with temporal tracking
CREATE TABLE edges (
  edge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID REFERENCES nodes(node_id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES nodes(node_id) ON DELETE CASCADE,
  weight FLOAT DEFAULT 1.0,      -- Relationship strength (-1 to 1)
  timestamps TIMESTAMPTZ[] DEFAULT '{}',  -- When this relationship occurred
  source_entry_id UUID REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id), -- Edge is specific to user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Node-Entry mapping: Track which concepts appear in which entries  
CREATE TABLE node_entry_map (
  node_entry_map_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID REFERENCES nodes(node_id) ON DELETE CASCADE,
  entry_id UUID REFERENCES journal_entries(journal_entry_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id), -- Mapping is specific to user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(node_id, entry_id)
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


-- Graph table indexes
CREATE INDEX idx_nodes_user_id ON nodes(user_id);
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_nodes_label_type_user ON nodes(label, type, user_id);
CREATE INDEX idx_edges_from_node ON edges(from_node_id);
CREATE INDEX idx_edges_to_node ON edges(to_node_id);
CREATE INDEX idx_edges_user_id ON edges(user_id);
CREATE INDEX idx_edges_source_entry ON edges(source_entry_id);
CREATE INDEX idx_node_entry_map_node ON node_entry_map(node_id);
CREATE INDEX idx_node_entry_map_entry ON node_entry_map(entry_id);
CREATE INDEX idx_node_entry_map_user ON node_entry_map(user_id);