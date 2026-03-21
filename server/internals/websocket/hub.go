package websocket

import (
	"errors"
	"sync"
)

type Hub struct {
	Rooms        map[string]*Room // key is room id and value is room
	RegisterRoom chan *Room 
	RemoveRoom   chan *Room
	mu           sync.RWMutex
}
 
// make a new hub for the server
func NewHub() *Hub {
	return &Hub{
		Rooms:        make(map[string]*Room),
		RegisterRoom: make(chan *Room),
		RemoveRoom:   make(chan *Room),
	}
}

// background gorountines to manage the rooms
func (h *Hub) Run() {
	for {
		select {
		case room := <-h.RegisterRoom:
			h.mu.Lock()
			h.Rooms[room.ID] = room
			h.mu.Unlock()
		case room := <-h.RemoveRoom:
			h.mu.Lock()
			delete(h.Rooms, room.ID)
			h.mu.Unlock()
		}
	}
}

func (h *Hub) GetRoom(roomId string) (*Room, error) {
	// This is a Read Lock. 
	// Multiple people can "read" the rooms at the exact same time without blocking each other.
	// However, if someone is currently "writing" (registering/removing), the readers have to wait.
	// IN-SHORT these are used here cuz they only block if someone is changing the room map
	h.mu.RLock()
	defer h.mu.RUnlock()
	room, exists := h.Rooms[roomId]
	if !exists {
		return nil, errors.New("room not found")
	}
	return room, nil
}
