package client

import (
	"github.com/DeepanshuChaid/Lair/websocket/room"
  
	"github.com/gorilla/websocket"
)

type Client struct {
 Room *room.Room

  Conn *websocket.Conn

  Send chan []byte
}

func (c *Client) ReadPump() {
  defer func() {
    c.Room.Unregister <- c
    c.Conn.Close()
  }()

  for {
    _, message, err := c.Conn.ReadMessage()

    if err != nil {
      c.Room.Unregister <- c
      c.Conn.Close()
      break
    }

    c.Room.Broadcast <- message
  }
}