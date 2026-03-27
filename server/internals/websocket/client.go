package websocket

import (
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second // if server cannot finish sending data in 10 sec give up its saves server resources
	pongWait       = 60 * time.Second // if the client does not send anything to server in the time span of sixty sec close the connection
	pingInterval   = (pongWait * 9) // we send a Ping before the 60-second pongWait expires. This gives the client 6 seconds to respond with a "Pong" to reset that 60-second timer.
	maxMessageSize = 1024 * 1024
)

type Client struct {
	ID     string // the reason we have diff id (generated on spot) and userid is because if a user enters the room in two dif browser tabs the user could kick itself
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
	// send a ping every 54 second
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
				return // stops the gorountines basically closes the connection on the server side
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				return
			}

		case <-ticker.C: // fires every 54 seconds browser automatically send the pong we dont have to write any js for this
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}