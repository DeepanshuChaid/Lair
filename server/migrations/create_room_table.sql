-- +goose-up

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  version INT DEFAULT 0, 
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- THIS IS THE BIG CHANGE
CREATE TABLE layers (
  -- Changed to TEXT to match your frontend "layer-123" IDs
  id TEXT PRIMARY KEY, 
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  -- This stores the coordinates, colors, etc.
  layer_data JSONB NOT NULL DEFAULT '{}'
);

-- Indexing for speed
CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
-- This index is CRITICAL for loading a board quickly
CREATE INDEX idx_layers_room_id ON layers(room_id);

-- +goose-down
DROP TABLE IF EXISTS layers;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS rooms;