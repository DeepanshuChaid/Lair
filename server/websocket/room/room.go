package room

import (
	"fmt"

	"github.com/DeepanshuChaid/Lair/websocket/client"
)

type Room struct {
	Name string

	Clients map[*client.Client]bool

	Broadcast chan []byte

	Register chan *client.Client

	Unregister chan *client.Client
}

func NewRoom(name string) *Room {
  return &Room{
    Name: name,
    Clients: make(map[*client.Client]bool),
    Broadcast: make(chan []byte),
    Register: make(chan *client.Client),
    Unregister: make(chan *client.Client),
  }
}

func (r *room) Run() {
  for {
    select {
      case client := <-r.Register:
        r.Clients[client] = true
        fmt.Println("New client registered: ", client)

      case client := <-r.Unregister:
        delete(r.Clients, client)
        client.Conn.Close()
        fmt.Println("Client unregistered: ", client)

      case message := <-r.Broadcast:
        for client := range r.Clients {
          client.Send <- message
        }
    }
  }
}