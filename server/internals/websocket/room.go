package websocket

import (
	"log"
	"sync"
)

type Room struct {
	ID      string
	Name    string
	OwnerID string
	Clients map[string]*Client
	// State can be any JSON-serializable data structure representing the current state of the room
	State interface{}

	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []Message

	// mu is used to synchronize access to the Clients map and State
	mu         sync.RWMutex
}

func NewRoom(id, name, ownerID string) *Room {
	return &Room{
		ID:         id,
		Name:       name,
		OwnerID:    ownerID,
		Clients:    make(map[string]*Client),
		State:      nil,
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []Message),
	}
}

func (r *Room) Run() {
	for {
		select {
		case client := <-r.Register:
			r.registerClient(client)

		case client := <-r.Unregister:
			if _, ok := r.Clients[client.ID]; ok {
				delete(r.Clients, client.ID)
				close(client.Send)
			}

		case message := <-r.Broadcast:
			for _, client := range r.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(r.Clients, client.ID)
				}
			}

		}
	}
}

func (r *Room) registerClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.Clients == nil {
		r.Clients = make(map[string]*Client)
	}
	r.Clients[client.ID] = client

	log.Println("Client registered:", client.ID)
}

func (r *Room) unregisterClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if room, ok := r.Clients[client.ID]; ok {
		delete(r.Clients, client.ID)
		close(room.Send)
		log.Println("Client unregistered:", client.ID)

		if len(room) == 0 {
			log.Println("Room is empty:", r.ID)
		}
	}
}

func (r *Room) broadcastMessage(message []Message) {
	r.mu.Lock()
	defer r.mu.Unlock()


	if client, ok := r.Clients[client.ID].Send; ok {
		for _, client := range r.Clients {
			select {
			case client.Send <- message:
			default:
				log.Printf("Failed to send message to client %s, closing connection", client.ID)
			}
		}
	}
}

// GetRoomClients returns the number of clients currently connected to the room
func (r *Room) GetRoomClients(roomId string) int {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return len(r.Clients)
} 