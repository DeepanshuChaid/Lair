package websocket

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/DeepanshuChaid/Lair/internals/database"
	cache "github.com/DeepanshuChaid/Lair/internals/redis"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var validate = validator.New()

func AddMember() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		var body struct {
			Email string `json:"email" validate:"required,email"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

		if err := validate.Struct(body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

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

		var OwnerId string
		err := database.Pool.QueryRow(
			ctx,
			"SELECT owner_id FROM rooms WHERE id = $1",
			roomId,
		).Scan(&OwnerId)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error", "details": err.Error()})
			return
		}

		if OwnerId != userId {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not the owner of this room"})
			return
		}

		var targetUserId string
		err = database.Pool.QueryRow(
			ctx,
			"SELECT id FROM users WHERE email = $1",
			body.Email,
		).Scan(&targetUserId)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}

		// UPSERT Member: Only add them if they aren't already there.
		// "ON CONFLICT DO NOTHING" prevents the 500 error if they refresh.
		_, err = database.Pool.Exec(ctx,
			`INSERT INTO room_member (room_id, user_id) 
			 VALUES ($1, $2) 
			 ON CONFLICT (room_id, user_id) DO NOTHING`, roomId, targetUserId,)
		
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"message": "Failed to join room", "error": err.Error(),})
			return
		}

		err = cache.Delete(ctx, "members:"+roomId)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Failed to delete the cache",
			})
		}

		c.JSON(http.StatusCreated, gin.H{"message": "Member added successfully"})
	}
}

func RemoveMember(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		var body struct {
			Email string `json:"email" validate:"required,email"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

		if err := validate.Struct(body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return	
		}

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

		var OwnerId string
		err := database.Pool.QueryRow(
			ctx,
			"SELECT owner_id FROM rooms WHERE id = $1",
			roomId,
		).Scan(&OwnerId)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error", "details": err.Error()})
			return
		}

		if OwnerId != userId {
			c.JSON(http.StatusForbidden, gin.H{"message": "You are not the owner of this room"})
			return
		}

		var targetUserId string
		err = database.Pool.QueryRow(
			ctx,
			"SELECT id FROM users WHERE email = $1",
			body.Email,
		).Scan(&targetUserId)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}

		if targetUserId == userId {
			c.JSON(http.StatusBadRequest, gin.H{"message": "You cannot remove yourself as the owner"})
			return
		}

		_, err = database.Pool.Exec(ctx,
			"DELETE FROM room_member WHERE room_id = $1 AND user_id = $2", 
			roomId, targetUserId,
		)
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"message": "Failed to remove member", "error": err.Error(),})
			return
		}

		room, err := hub.GetRoom(roomId)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Room not found"})
			return
		}

		room.Kick <- &targetUserId

		err = cache.Delete(ctx, "members:"+roomId)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Failed to delete the cache",
			})
		}

		c.JSON(http.StatusOK, gin.H{"message": "Member removed successfully"})
	}
}


func VerfiyRoom() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
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

		// // DATABASE VALIDATION
		var isPublic bool
		// err := database.Pool.QueryRow(ctx,
		// 	"SELECT is_public FROM rooms WHERE id = $1", roomId).Scan(&isPublic)
		// if err != nil {
		// 	c.JSON(http.StatusNotFound, gin.H{"message": "Room not found"})
		// 	return
		// }

		// // check if user is member of room
		var isMember bool
		// err = database.Pool.QueryRow(ctx,
		// 	"SELECT EXISTS(SELECT 1 FROM room_member WHERE room_id = $1 AND user_id = $2)", roomId, userId).Scan(&isMember)
		// if err != nil {
		// 	c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error"})
		// 	return
		// }

		err := database.Pool.QueryRow(
			ctx,
			`SELECT 
				is_public, 
				EXISTS(SELECT 1 FROM room_member WHERE room_id = $1 AND user_id = $2) as is_member 
			FROM rooms WHERE id = $1`,
			roomId, userId,
		).Scan(&isPublic, &isMember)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error", "details": err.Error()})
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

func SaveData() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), time.Second*10)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
			return
		}

		roomId := c.Param("id")
		if roomId == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Room ID is required"})
			return
		}

		var body struct {
			layers json.RawMessage `json:"layers"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body!"})
			return
		}

		result, err := database.Pool.Exec(
			ctx,
			"UPDATE room_state SET state = $1 WHERE room_id = $2",
			body.layers,
			roomId,
		)

		// Optional: Check if the room actually exists
        if result.RowsAffected() == 0 {
            c.JSON(http.StatusNotFound, gin.H{"message": "Room state not found"})
            return
        }

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error!", "details": err.Error()})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "Successfully Saved the Room State!"})
	}
}

func ServerWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
			return
		}

		// roomId := c.Param("roomId")
		// if roomId == "" {
		// 	c.JSON(http.StatusBadRequest, gin.H{"message": "Room ID is required"})
		// 	return
		// }

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


		// Upgrade connection means convert the http protocol into websocket connection
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to upgrade to WebSocket", "error": err.Error(),})
			return
		}

		// Get or create room
		room, err := hub.GetRoom(val)
		if err != nil {
			room = NewRoom(val, "naam me kya rakha hai", userId)
			hub.RegisterRoom <- room
			go room.Run()
		}

		// Create client and register
		client := NewClient(conn, userId, val, hub)
		room.Register <- client

		var rawState json.RawMessage
		err = database.Pool.QueryRow(c.Request.Context(),
			"SELECT state FROM room_state WHERE room_id = $1", val).Scan(&rawState)
		
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

