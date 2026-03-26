package roomController

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/DeepanshuChaid/Lair/internals/cloudinary"
	"github.com/DeepanshuChaid/Lair/internals/database"
	roomModel "github.com/DeepanshuChaid/Lair/internals/models/room"
	cache "github.com/DeepanshuChaid/Lair/internals/redis"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5"
)

var validate = validator.New()

// ==================================== //
//
//	Get users rooms          //
//
// ==================================== //
func GetUserRooms() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(401, gin.H{"message": "Unauthorized"})
			return
		}

		var Rooms []roomModel.Room

		// Try to get from cache first
		cachedData, err := cache.Get(ctx, "rooms:"+userId)
		if err == nil {
			if err := json.Unmarshal([]byte(cachedData), &Rooms); err == nil {
				c.JSON(http.StatusOK, gin.H{
					"message": "Rooms fetched successfully (from cache)",
					"rooms":   Rooms,
					"cached":  true,
				})
				return
			}
		}

		rows, err := database.Pool.Query(
			ctx,
			"SELECT id, title, description, is_public, thumbnail_url, created_at, updated_at FROM rooms WHERE owner_id = $1",
			userId,
		)
		if err != nil {
			c.JSON(500, gin.H{"message": "Database error", "details": err.Error()})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var room roomModel.Room
			if err := rows.Scan(
				&room.ID,
				&room.Title,
				&room.Description,
				&room.IsPublic,
				&room.Thumbnail,
				&room.CreatedAt,
				&room.UpdatedAt,
			); err != nil {
				c.JSON(500, gin.H{"message": "Database error", "details": err.Error()})
				return
			}
			Rooms = append(Rooms, room)
		}

		// Cache the result for 5 minutes
		stringifiedData, err := json.Marshal(Rooms)
		if err == nil {
			cache.Set(ctx, "rooms:"+userId, stringifiedData, 5*time.Hour)
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Rooms fetched successfully",
			"rooms":   Rooms,
		})

	}
}

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
			Title       string `json:"title" binding:"required" validate:"required,min=3,max=50"`
			Description string `json:"description" validate:"required,min=3,max=100"`
			IsPublic    bool   `json:"is_public"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"message": "Invalid request body", "details": err.Error()})
			return
		}

		if err := validate.Struct(body); err != nil {
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
			"INSERT INTO rooms (owner_id, title, description, is_public) VALUES ($1, $2, $3, $4) RETURNING id",
			userId,
			body.Title,
			body.Description,
			body.IsPublic,
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
			"INSERT INTO room_member (room_id, user_id) VALUES ($1, $2)",
			roomId, userId,
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

		err = cache.Delete(ctx, "rooms:"+userId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to delete cached data"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
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

		err = cache.Delete(ctx, "rooms:"+userId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to delete cached data"})
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

		err = cache.Delete(ctx, "rooms:"+userId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to delete cached data"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Room updated successfully",
			"roomId":  roomId,
			"data":    body,
		})

	}
}

func GetRoomMembers() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		roomId := c.Param("id")
		if roomId == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Nigga add the fkin roomID You retard!",
			})
			return
		}

		var room struct {
			ID           string          `json:"id"`
			OwnerID      string          `json:"owner_id"`
			Title        string          `json:"title"`
			Version      int             `json:"version"`
			CreatedAt    time.Time       `json:"created_at"`
			UpdatedAt    time.Time       `json:"updated_at"`
			State        json.RawMessage `json:"state"`
			Members      json.RawMessage `json:"members"` // Scan the whole JSON array here
		}

		cachedData, err := cache.Get(ctx, "members:"+roomId)
		if err == nil {
			if err := json.Unmarshal([]byte(cachedData), &room); err == nil {
				c.JSON(http.StatusOK, gin.H{
					"rooms":   cachedData,
					"cached":  true,
				})
				return
			}
		}

		// Using a single query to get Room + State + Members array
		// We use COALESCE to handle rooms that might not have members yet
		query := `
            SELECT 
                r.id, r.owner_id, r.title, r.version, r.created_at, r.updated_at,
                COALESCE(rs.state, '{}'::jsonb),
                COALESCE(json_agg(json_build_object(
                    'id', u.id,
                    'name', u.name,
                    'email', u.email,
                    'profile_picture', u.profile_picture,
                    'role', rm.role
                )) FILTER (WHERE u.id IS NOT NULL), '[]'::json) AS members
            FROM rooms r
            LEFT JOIN room_state rs ON r.id = rs.room_id
            LEFT JOIN room_member rm ON r.id = rm.room_id
            LEFT JOIN users u ON rm.user_id = u.id
            WHERE r.id = $1
            GROUP BY r.id, rs.state;`

		err = database.Pool.QueryRow(ctx, query, roomId).Scan(
			&room.ID, &room.OwnerID, &room.Title, &room.Version,
			&room.CreatedAt, &room.UpdatedAt, &room.State, &room.Members,
		)

		if err != nil {
			// Log the actual error for debugging
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed", "details": err.Error()})
			return
		}

		stringifiedData, err := json.Marshal(room)
		if err == nil {
			cache.Set(ctx, "members:"+roomId, stringifiedData, 5*time.Hour)
		}

		c.JSON(http.StatusOK, gin.H{
			"room":    room,
		})
	}
}

// ==================================== //
// Update Room Thumbnail   //
// ==================================== //
func UpdateRoomThumbnail() gin.HandlerFunc {
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

		file, err := c.FormFile("thumbnail")
		if err != nil {
			c.JSON(400, gin.H{"message": "No file uploaded"})
			return
		}

		if file.Size > 5*1024*1024 {
			c.JSON(400, gin.H{"message": "File too large (max 5MB)"})
			return
		}

		if !strings.HasPrefix(file.Header.Get("Content-Type"), "image/") {
			c.JSON(400, gin.H{"message": "Only image files allowed"})
			return
		}

		openedFile, err := file.Open()
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to open uploaded file"})
			return
		}
		defer openedFile.Close()

		uploadResult, err := cloudinary.Upload(ctx, openedFile, uploader.UploadParams{
			Folder:    "thumbnails",
			PublicID:  roomId,
			Overwrite: api.Bool(true),
		})

		if err != nil {
			c.JSON(500, gin.H{"message": "Cloudinary upload failed", "detail": err.Error()})
			return
		}

		imageUrl := uploadResult.SecureURL

		_, err = database.Pool.Exec(
			ctx,
			"UPDATE rooms SET thumbnail_url = $1 WHERE id = $2",
			imageUrl, roomId,
		)

		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				c.JSON(http.StatusNotFound, gin.H{"message": "Room not found"})
				return
			}
			c.JSON(500, gin.H{"message": "DB update failed", "detail": err.Error()})
			return
		}

		err = cache.Delete(ctx, "rooms:"+userId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to delete cached data"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message":   "Thumbnail updated successfully",
			"roomId":    roomId,
			"thumbnail": imageUrl,
		})
	}
}
