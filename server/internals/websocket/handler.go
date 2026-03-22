package websocket

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/DeepanshuChaid/Lair/internals/database"
	cache "github.com/DeepanshuChaid/Lair/internals/redis"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}


func VerfiyRoom() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
			return
		}

		roomId := c.Param("roomId")
		if roomId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Room ID is required"})
			return
		}

		// DATABASE VALIDATION
		var isPublic bool
		err := database.Pool.QueryRow(ctx,
			"SELECT is_public FROM rooms WHERE id = $1", roomId).Scan(&isPublic)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Room not found"})
			return
		}

		// check if user is member of room
		var isMember bool
		err = database.Pool.QueryRow(ctx,
			"SELECT EXISTS(SELECT 1 FROM room_member WHERE room_id = $1 AND user_id = $2)", roomId, userId).Scan(&isMember)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error"})
			return
		}

		if !isMember && !isPublic {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not a member of this room"})
			return
		}

		// UPSERT Member: Only add them if they aren't already there.
		// "ON CONFLICT DO NOTHING" prevents the 500 error if they refresh.
		_, err = database.Pool.Exec(ctx,
			`INSERT INTO room_member (room_id, user_id) 
			 VALUES ($1, $2) 
			 ON CONFLICT (room_id, user_id) DO NOTHING`, roomId, userId)
		
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"message": "Failed to join room", "error": err.Error(),})
			return
		}

		ticket := uuid.New().String()
		cache.Set(ctx, ticket, userId, 5*time.Minute)

		c.JSON(http.StatusOK, gin.H{"message": "Verfied for entering room successfully", "ticket": ticket})
	}
}


func ServerWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
			return
		}

		roomId := c.Param("roomId")
		if roomId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Room ID is required"})
			return
		}

		ticket := c.Query("ticket")
		if ticket == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Ticket is required"})
			return
		}

		val, err := cache.Get(c.Request.Context(), ticket)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid ticket"})
			return
		}

		if val != userId {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid ticket"})
			return
		}


		// Upgrade connection
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to upgrade to WebSocket", "error": err.Error(),})
			return
		}

		// Get or create room
		room, err := hub.GetRoom(roomId)
		if err != nil {
			room = NewRoom(roomId, "naam me kya rakha hai", userId)
			hub.RegisterRoom <- room
			go room.Run()
		}

		// Create client and register
		client := NewClient(conn, userId, roomId, hub)
		room.Register <- client

		var rawState json.RawMessage
		err = database.Pool.QueryRow(c.Request.Context(),
			"SELECT state FROM room_state WHERE room_id = $1", roomId).Scan(&rawState)
		
		if err == nil && len(rawState) > 0 {
			// Send current board state as the first message
			client.Send <- &Message{
				Type:    "init_state",
				Content: rawState,
				SentAt:  time.Now().UnixMilli(),
			}
		}

		// Start pumps
		go client.WritePump()
		go client.ReadPump(room)
	}
}