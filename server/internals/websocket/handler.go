package websocket

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServerWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		roomId := c.Param("roomId")

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade to WebSocket"})
			return
		}

		room, err := hub.GetRoom(roomId)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}


		client := &Client{
			ID: userId,
			Conn: conn,
			RoomID: roomId,
			Send: make(chan []byte, 256),
		}

		room.Register <- client

		go client.WritePump()
		go client.ReadPump(room)
		
	}
}