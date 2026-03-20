package roomController

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

func CreateRoom() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(401, gin.H{"message": "Unauthorized"})
			return
		}

		var body struct {
			title string `json:"title"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"message": "Invalid request body"})
			return
		}

		var roomId string

		tx, err := database.Pool.Begin(ctx)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to start transaction"})
			return
		}
		defer tx.Rollback(ctx)

		// create room
		err = tx.QueryRow(ctx,
			"INSERT INTO rooms (owner_id, title) VALUES ($1, $2) RETURNING id",
			userId,
			body.title,
		).Scan(&roomId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create room"})
			return
		}

		// add owner as member
		_, err = tx.Exec(ctx,
			"INSERT INTO room_member (room_id, user_id, role) VALUES ($1, $2, $3)",
			roomId, userId, "owner",
		)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to add Owner", "details": err.Error(),})
			return
		}

		// commit
		if err = tx.Commit(ctx); err != nil {
			c.JSON(500, gin.H{"message": "Failed to commit transaction"})
			return
		}

		c.JSON(200, gin.H{
			"message": "Room created successfully",
			"roomId": roomId,
		})
	}
}


func DeleteRoom() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(401, gin.H{"message": "Unauthorized"})
			return
		}

		roomId := c.Param("id")
		if roomId == "" {
			c.JSON(400, gin.H{"message": "Room ID is required"})
			return
		}

		var ownerID string

		err := database.Pool.QueryRow(ctx, "SELECT owner_id FROM rooms WHERE id = $1", roomId).Scan(&ownerID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) { // or sql.ErrNoRows
				c.JSON(404, gin.H{"message": "Room not found"})
				return
			}
			c.JSON(500, gin.H{"message": "Database error"})
			return
		}

		if ownerID != userId {
			c.JSON(403, gin.H{"message": "Unauthorized: You are not the owner"})
			return
		}

		// If we got here, they ARE the owner. Now delete.
		_, err = database.Pool.Exec(ctx, "DELETE FROM rooms WHERE id = $1", roomId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to delete room"})
			return
		}


		c.JSON(http.StatusOK, gin.H{
			"message": "Room deleted successfully",
			"roomId":  roomId,
		})
	}
}