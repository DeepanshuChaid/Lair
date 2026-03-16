// package main

// import "fmt"

// // basically the lists of users
// type client struct {
//   // hub is a pointer to the hub basically the hub the client is connected to
// 	hub  *hub

//   // send is a channel of byte arrays basically the messages that the client sends
// 	send chan []byte
// }

// // chan are used for sending and revieveing data in goruntines
// type hub struct {
// 	// storing all of the clients bascially a list
// 	clients map[*client]bool

//   // this is a channel of byte arrays basically the messages that the hub sends
// 	broadcast chan []byte
// }

// // simply returns a hub
// func newHub() *hub {
// 	return &hub{
// 		clients:   make(map[*client]bool),
// 		broadcast: make(chan []byte),
// 	}
// }

// // this is a method of hub a infinite loop where it waits for the ALL THE sent messages and just prints it
// func (h *hub) run() {
// 	for {

//     // dont get confused by syntax this is just a way to recieve data from a channel
// 		message := <-h.broadcast
//     fmt.Println("Hub received:", string(message))

//     // map the clint list and sent te message to each client
// 		for client := range h.clients {
// 			client.send <- message
// 		}

// 	}
// }

// func main() {
// 	hub := newHub()

// 	go hub.run()

//   client := client{
//     hub: hub,
//     send: make(chan []byte),
//   }

//   hub.clients[&client] = true

//   go func() {
//     for msg := range client.send {
//       fmt.Println("Client received:", string(msg))
//     }
//   }()

// 	// SENDING DATA
// 	hub.broadcast <- []byte("Hello from hub")

// 	// hub.broadcast <- []byte("Hello from hub again")

// 	// hub.broadcast <- []byte("HATE HATE HATE IF THE WORD HATE WAS ENGRAVED ON EACH CELL ON MY BODY IT WOULD BE EQUAL TO THE ONE BILLIONTH OF THE HATE I FEEL TOWARDS YOU AT THIS MICRO INSTANT HATE HAHAH HATEEE!")
// }
