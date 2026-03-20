package websocket

import "errors"

type Hub struct {
	Rooms map[string]*Room
}

func NewHub() *Hub {
	return &Hub{
		Rooms: make(map[string]*Room),
	}
}

func (h *Hub) GetRoom(roomId string) (*Room, error) {
	room, exists := h.Rooms[roomId]
	if !exists {
		return nil, errors.New("room not found")
	}
	return room, nil
}
