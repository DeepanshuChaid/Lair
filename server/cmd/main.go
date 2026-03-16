package main

import "fmt"

type hub struct {
  // list of all the clients
  clients map[*client]bool

  // client connects -> register chan
  register chan *client
  // client disconnects -> unregister chan
  unregister chan *client

  // messages sent to all clients
  broadcast chan []byte
}

func newHub() *hub {
  return &hub{
    clients: make(map[*client]bool),
    register: make(chan *client),
    unregister: make(chan *client),
    broadcast: make(chan []byte),
  }
}

func (h *hub) run() {
  for {
    select {
      case client := <-h.register:
        h.clients[client] = true
      case client := <-h.unregister:
        // delete bascially removes the client from the map
        delete(h.clients, client)
        // close is really imp, if any gorountine is listening to the channel, it will not be stopped
        close(client.send)
        fmt.Println("Client disconnected")  

      case message := <-h.broadcast:
        fmt.Println("broadcast message: ", string(message))

      for client := range h.clients {
        client.send <- message
      }
    }
  }
}

type client struct {
  // refers to the hub that the client is connected to
  hub *hub

  // message received from the hub
  send chan []byte
}


func main () {
  h := newHub()

  go h.run()

  c := &client{
    hub: h,
    send: make(chan []byte),
  }
  
  h.register <- c

  go func() {
    for msg := range c.send {
      fmt.Println("Client received:", string(msg))
    }
  }()

  // this is same as client sending a message to the hub
  h.broadcast <- []byte("Hello from hub")

  select{}
}