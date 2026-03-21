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

// ==================================== //
//
//	Create Room            //
//
// ==================================== //
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
			Title       string `json:"title" binding:"required"`
			Description string `json:"description"`
			IsPublic    bool   `json:"isPublic"`
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
			"INSERT INTO rooms (owner_id, title, description, is_public, version) VALUES ($1, $2, $3, $4, $5) RETURNING id",
			userId,
			body.Title,
			body.Description,
			body.IsPublic,
			0,
		).Scan(&roomId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create room"})
			return
		}

		// initialize room state
		_, err = tx.Exec(ctx,
			`INSERT INTO room_state (room_id, state)
			VALUES ($1, '{}'::jsonb)
			ON CONFLICT (room_id) DO NOTHING`,
			roomId,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Failed to initialize room state",
				"details": err.Error(),
			})
			return
		}

		// add owner as member
		_, err = tx.Exec(ctx,
			"INSERT INTO room_member (room_id, user_id, role) VALUES ($1, $2, $3)",
			roomId, userId, "admin",
		)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to add owner", "details": err.Error()})
			return
		}

		// commit
		if err = tx.Commit(ctx); err != nil {
			c.JSON(500, gin.H{"message": "Failed to commit transaction"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Room created successfully",
			"roomId":  roomId,
		})
	}
}

// ==================================== //
//
//	Delete Room            //
//
// ==================================== //
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
			if errors.Is(err, pgx.ErrNoRows) {
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

// ==================================== //
//
//	Update Room            //
//
// ==================================== //
func UpdateRoom() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
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
			Title       string `json:"title"`
			Description string `json:"description"`
			IsPublic    bool   `json:"is_public"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

		var ownerID string

		err := database.Pool.QueryRow(ctx, "SELECT owner_id FROM rooms WHERE id = $1", roomId).Scan(&ownerID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{"message": "Room not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Database error"})
			return
		}

		if ownerID != userId {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Unauthorized: You are not the owner",
				"details": "Only the room owner can update the room",
			})
			return
		}

		_, err = database.Pool.Exec(
			ctx,
			"UPDATE rooms SET title = $2, description = $3, is_public = $4 WHERE id = $1",
			roomId,
			body.Title,
			body.Description,
			body.IsPublic,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update room"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Room updated successfully",
			"roomId":  roomId,
			"data":    body,
		})

	}
}
