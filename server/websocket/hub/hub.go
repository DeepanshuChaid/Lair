package hub

import "github.com/DeepanshuChaid/Lair/websocket/room"

type Hub struct {
  Rooms map[string]*room.Room
}

func NewHub() *Hub {
  return &Hub{
    Rooms: make(map[string]*room.Room),
  }
}

func (h *Hub) CreateRoom(name string) *room.Room {
  if room, ok := h.Rooms[name]; ok {
    return room
  }

  room := room.NewRoom()(name)
  h.Rooms[name] = room

  go room.run()

  return room
}