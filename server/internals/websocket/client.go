package websocket

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	// the maximum time allowed to write message in a second
	writeWait      = 10 * time.Second
	// the maximum time allowed to read message in a second
	pongWait       = 60 * time.Second
	// the frequeny at which the server sends ping messages to the client
	pingInterval   = (pongWait * 9) / 10
	// the maximum size of a message in bytes
	maxMessageSize = 1024 * 1024
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


	// SETTING DEADLINES FOR EFFECTIVE WEBSOCKET CONNECTION (TO MYSEFLF YOU DONT NEED TO LEARN THESE)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		// message we are receiving from the client
		var message Message
		err := c.Conn.ReadJSON(&message) 
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		
		// adding the room id and user id to the message
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
			// Deadline is like if you fail to comp the task in (eg := 3 days) you are fired!
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))	// basically if we are not able to write the messag in 10 seconds we are fired!
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