package hub

import "github.com/DeepanshuChaid/Lair/internals/websocket/room"

type Hub struct {
	Rooms map[string]*room.Room
}

func NewHub() *Hub {
	return &Hub{
		Rooms: make(map[string]*room.Room),
	}
}