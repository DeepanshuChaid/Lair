package room

import "github.com/DeepanshuChaid/Lair/internals/websocket/client"

type Room struct {
	ID      string
	Name    string
	OwnerID string
	Clients map[string]*client.Client
	// State can be any JSON-serializable data structure representing the current state of the room
	State interface{}

	Register   chan *client.Client
	Unregister chan *client.Client
	Broadcast  chan []byte
}
