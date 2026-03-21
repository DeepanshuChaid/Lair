package websocket

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingInterval   = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
)

type Client struct {
	ID     string
	UserId string
	RoomID string
	Conn   *websocket.Conn
	hub    *Hub
	Send   chan *Message
}

func NewClient(conn *websocket.Conn, userId, roomId string, hub *Hub) *Client {
	return &Client{
		ID:     uuid.New().String(),
		UserId: userId,
		RoomID: roomId,
		Conn:   conn,
		hub:    hub,
		Send:   make(chan *Message, 256),
	}
}

func (c *Client) ReadPump(room *Room) {
	defer func() {
		c.Conn.Close()
		room.Unregister <- c
	}()

	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var message Message
		err := c.Conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		log.Printf("RAW MESSAGE: %+v\n", message)
		

		message.RoomId = c.RoomID
		message.UserId = c.UserId

		// showing error
		room.Broadcast <- &message
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingInterval)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}