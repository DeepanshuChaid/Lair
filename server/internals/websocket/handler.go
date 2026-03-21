package websocket

import (
	"net/http"

	"github.com/DeepanshuChaid/Lair/internals/database"
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
		if roomId == "" {
			c.JSON(400, gin.H{"error": "Room ID is required"})
			return
		}
		var roomState interface{}

		err := database.Pool.QueryRow(c.Request.Context(),
		 "SELECT id FROM rooms WHERE id = $1", roomId).Scan(&roomId)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		err = database.Pool.QueryRow(c.Request.Context(),
			"SELECT state FROM room_state WHERE room_id = $1", roomId).Scan(&roomState)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room state"})
			return
		}

		// Upgrade the HTTP connection to a WebSocket connection
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upgrade to WebSocket"})
			return
		}

		conn.WriteJSON(roomState)

		room, err := hub.GetRoom(roomId)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}

		client := NewClient(conn, userId, roomId, hub)
		room.Register <- client

		go client.WritePump()
		go client.ReadPump(room)
		
	}
}