package main 

import "fmt"

// chan are used for sending and revieveing data in goruntines
type hub struct {
  broadcast chan []byte
}

// simply returns a hub
func newHub() *hub {
  return &hub{
    broadcast: make(chan []byte),
  }
}

// this is a method of hub a infinite loop where it waits for the ALL THE sent messages and just prints it
func (h *hub) run () {
  for {
    
    for message := range h.broadcast {
      fmt.Println("HUb recevied", string(message))
    }
    
  }
}


func main () {
  hub := newHub()

  go hub.run()

  // SENDING DATA
  hub.broadcast <- []byte("Hello from hub")

  hub.broadcast <- []byte("Hello from hub again")

  hub.broadcast <- []byte("HATE HATE HATE IF THE WORD HATE WAS ENGRAVED ON EACH CELL ON MY BODY IT WOULD BE EQUAL TO THE ONE BILLIONTH OF THE HATE I FEEL TOWARDS YOU AT THIS MICRO INSTANT HATE HAHAH HATEEE!")
}