package websocket

import (
	"log"
	"sync"
)

// hub {rooms: map[string]*Room, channels handling register and unregister}

type Room struct {
	// INFO
	ID      string // will be added from the db
	Name    string // FIXED NAMES NOT SURE WHY I EVEN I ADDED IT
	OwnerID string

	// string basically represents the client ID, and the value is the pointer to the Client struct. This allows us to easily manage clients in the room, such as broadcasting messages to all clients or removing a client when they disconnect.
	Clients map[string]*Client

	// State can be any JSON-serializable data structure representing the current state of the room
	State interface{} // any

	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
	Kick chan *string

	// mu is used to synchronize access to the Clients map and State
	mu sync.RWMutex
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
		Broadcast:  make(chan *Message),
		Kick: make(chan *string),
	}
}

// basically a background gorountines for managing the clients 
func (r *Room) Run() {
	for {
		select {
		case client := <-r.Register:
			r.registerClient(client)

		case client := <-r.Unregister:
			r.unregisterClient(client)

		case message := <-r.Broadcast:
			r.broadcastMessage(message)

		case req := <-r.Kick:
			r.kickClient(req)
		}
	}
}


func (r *Room) registerClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	// if r.Client is somehow a holy nil we just make it :)
	if r.Clients == nil {
		r.Clients = make(map[string]*Client)
	}
	r.Clients[client.ID] = client // simply add the client to the map

	log.Println("Client registered:", client.ID)
}

func (r *Room) unregisterClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.Clients[client.ID]; ok {
		delete(r.Clients, client.ID)
		// here the chan is closed no further messages can be sent to the channel
		// this is done so that the write pump is terminated
		close(client.Send)
		log.Println("Client unregistered:", client.ID)

		if len(r.Clients) == 0 {
			log.Println("Room is empty:", r.ID)
		}
	}
}

func (r *Room) broadcastMessage(message *Message) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// send the message to every clients send channel
	for _, client := range r.Clients {
		select {
		case client.Send <- message:
		default:
			log.Printf("Failed to send message to client %s, closing connection", client.ID)
		}
	}
}

func (r *Room) kickClient(req *string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	client, ok := r.Clients[*req]
	if !ok {
		return
	}
	delete(r.Clients, *req)
	close(client.Send)
	log.Println("Client kicked:", *req)
}

// GetRoomClients returns the number of clients currently connected to the room
func (r *Room) GetRoomClients() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	// here we rlock block the func until there are not changes made it the room

	return len(r.Clients)
}
