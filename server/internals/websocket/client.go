package websocket

import (
	"github.com/gorilla/websocket"
)

type Client struct { 
	ID string
	Conn *websocket.Conn
	RoomID string
	Send chan []byte
}

func (c *Client) ReadPump(room *Room) {
	defer func() {
		c.Conn.Close()
		room.Unregister <- c
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		room.Broadcast <- message
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()

	for msg := range c.Send {
		err := c.Conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			break
		}
	}
}