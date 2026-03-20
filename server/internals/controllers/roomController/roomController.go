package roomController

import (
	"context"
	"net/http"
	"time"

	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/gin-gonic/gin"
)

func CreateRoom() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		var roomId string

		tx, err := database.Pool.Begin(ctx)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to start transaction"})
			return
		}
		defer tx.Rollback(ctx)

		// create room
		err = tx.QueryRow(ctx,
			"INSERT INTO rooms (owner_id) VALUES ($1) RETURNING id",
			userId,
		).Scan(&roomId)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create room"})
			return
		}

		// add owner as member
		_, err = tx.Exec(ctx,
			"INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)",
			roomId, userId, "owner",
		)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to add member"})
			return
		}

		// commit
		if err = tx.Commit(ctx); err != nil {
			c.JSON(500, gin.H{"error": "Failed to commit transaction"})
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
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		roomId := c.Param("id")
		if roomId == "" {
			c.JSON(400, gin.H{"error": "Room ID is required"})
			return
		}

		result, err := database.Pool.Exec(ctx,
			"DELETE FROM rooms WHERE id = $1 AND owner_id = $2",
			roomId, userId,
		)
		if err != nil { 
			c.JSON(500, gin.H{"error": "Failed to delete room"})
			return
		}

		rowsAffected := result.RowsAffected()
		if rowsAffected == 0 {
			c.JSON(404, gin.H{"error": "Room not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Room deleted successfully",
			"roomId":  roomId,
		})
	}
}