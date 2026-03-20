-- +goose-up

CREATE TABLE room_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  room_id UUID UNIQUE NOT NULL
    REFERENCES rooms(id) ON DELETE CASCADE,

  state JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL DEFAULT 'Untitled Board',

  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE room_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'editor',

  created_at TIMESTAMP DEFAULT now(),

  UNIQUE(user_id, room_id)
);