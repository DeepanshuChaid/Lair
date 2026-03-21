package websocket

import (
	"errors"
	"sync"
)

type Hub struct {
	Rooms        map[string]*Room
	RegisterRoom chan *Room
	RemoveRoom   chan *Room
	mu           sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		Rooms:        make(map[string]*Room),
		RegisterRoom: make(chan *Room),
		RemoveRoom:   make(chan *Room),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case room := <-h.RegisterRoom:
			h.mu.Lock()
			h.Rooms[room.ID] = room
			h.mu.Unlock()
		case room := <-h.RemoveRoom:
			h.mu.Lock()
			if _, ok := h.Rooms[room.ID]; ok {
				delete(h.Rooms, room.ID)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) GetRoom(roomId string) (*Room, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	room, exists := h.Rooms[roomId]
	if !exists {
		return nil, errors.New("room not found")
	}
	return room, nil
}
