-- +goose-up

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  is_public BOOLEAN DEFAULT FALSE,

  thumbnail_url TEXT,

  -- FOR FIXING CONFLICTS BETWEEN MULTIPLE EDITORS IN THE SAME ROOM
  version INT DEFAULT 0, 

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
)

CREATE TABLE room_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  role TEXT NOT NULL DEFAULT 'editor',
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(room_id, user_id)
)

CREATE TABLE room_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,

  state JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  UNIQUE(room_id)
)

CREATE INDEX idx_rooms_owner ON rooms(owner_id);

CREATE INDEX idx_room_members_user ON room_members(user_id);

CREATE INDEX idx_room_members ON room_members(room_id);

CREATE INDEX idx_room_state ON room_state(room_id);

-- +goose-down
DROP TABLE IF EXISTS room_state;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS rooms;

