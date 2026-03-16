package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

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
		clients:    make(map[*client]bool),
		register:   make(chan *client),
		unregister: make(chan *client),
		broadcast:  make(chan []byte),
	}
}

func (h *hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true

		case client := <-h.unregister:
			// delete bascially removes the client from the map
			// close is really imp, if any gorountine is listening to the channel, it will not be stopped
			delete(h.clients, client)
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

	// connection of the websocket library
	conn *websocket.Conn

	// message received from the hub
	send chan []byte
}

func (c *client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()

		if err != nil {
			break
		}

		c.hub.broadcast <- message
	}
}

func (c *client) writePump() {
	for message := range c.send {
		err := c.conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			fmt.Println("Error writing message:", err)
			return
		}
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func serveWs(hub *hub, c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)

	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}

	client := &client{
		hub:  hub,
		conn: conn,
		send: make(chan []byte),
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	h := newHub()

	go h.run()

	router := gin.Default()

	router.GET("/ws", func(c *gin.Context) {
		serveWs(h, c)
	})

	PORT := os.Getenv("PORT")

	router.Run(":" + PORT)
}
