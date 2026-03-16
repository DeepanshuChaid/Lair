package main

import "fmt"


type client struct {
	hub  *hub
	send chan []byte
}

type hub struct {
	clients map[*client]bool
	broadcast chan []byte
}

// simply returns a hub
func newHub() *hub {
	return &hub{
		clients:   make(map[*client]bool),
		broadcast: make(chan []byte),
	}
}

func (h *hub) run() {
	for {

		message := <-h.broadcast
    fmt.Println("Hub received:", string(message))

		for client := range h.clients {
			client.send <- message
		}

	}
}

func main() {
	hub := newHub()

	go hub.run()

  client := client{
    hub: hub,
    send: make(chan []byte),
  }

  hub.clients[&client] = true

  go func() {

    hub.broadcast <- []byte("Hello from hub")
    
    for msg := range client.send {
      fmt.Println("Client received:", string(msg))
    }
  }()

  // keeps the program alive
  select{}

	// hub.broadcast <- []byte("Hello from hub again")

	// hub.broadcast <- []byte("HATE HATE HATE IF THE WORD HATE WAS ENGRAVED ON EACH CELL ON MY BODY IT WOULD BE EQUAL TO THE ONE BILLIONTH OF THE HATE I FEEL TOWARDS YOU AT THIS MICRO INSTANT HATE HAHAH HATEEE!")
}
