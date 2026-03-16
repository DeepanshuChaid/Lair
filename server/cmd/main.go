package main 

import "fmt"

type hub struct {
  broadcast chan []byte
}

func newHub() *hub {
  return &hub{
    broadcast: make(chan []byte),
  }
}

func (h *hub) run () {
  for {
    message := <-h.broadcast
    fmt.Println("HUB revieved", string(message))
  }
}

func main () {
  hub := newHub()

  go hub.run()

  hub.broadcast <- []byte("Hello from hub")
}