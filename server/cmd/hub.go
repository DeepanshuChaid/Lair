package main

type Hub struct {
  Clients map[*Client]bool

  Broadcast chan []byte

  register chan *Client

  unregister chan *Client
}

func NewHub() *Hub {
  return &Hub{
    Clients: make(map[*Client]bool),
    Broadcast: make(chan []byte),
    register: make(chan *Client),
    unregister: make(chan *Client),
  }
}

func (h *Hub) run() {
  for {
    select {
      case client := <-h.register:
        h.Clients[client] = true

      case client := <-h.unregister:
        delete(h.Clients, c)
    }
  }
}