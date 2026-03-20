package authController

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"time"

	"github.com/DeepanshuChaid/Lair/internals/cloudinary"
	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/DeepanshuChaid/Lair/internals/oauth"
	"github.com/DeepanshuChaid/Lair/internals/utils/authUtils"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

var isProduction = os.Getenv("ENV") == "production"

func Register() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		var body struct {
			Id       string `json:"id"`
			Name     string `json:"name" validate:"required,min=2"`
			Email    string `json:"email" validate:"required,email"`
			Password string `json:"password" validate:"required,min=6"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

		err := validate.Struct(body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body", "detail": err.Error()})
			return
		}

		// 🔐 hash password
		hashedPassword, err := authUtils.HashPassword(body.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to hash password"})
			return
		}

		tx, err := database.Pool.Begin(ctx)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to start transaction"})
			return
		}

		defer tx.Rollback(ctx) // safe rollback if something fails

		err = tx.QueryRow(ctx, "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id", body.Name, body.Email, hashedPassword).Scan(&body.Id)
		if err != nil {
			if strings.Contains(err.Error(), "duplicate key") {
				c.JSON(http.StatusConflict, gin.H{"message": "Email already exists"})
				return
			}
			c.JSON(500, gin.H{"message": "Failed to create user"})
			return
		}

		var authProviderId string

		err = tx.QueryRow(ctx, "INSERT INTO auth_providers (user_id, provider) VALUES ($1, $2) RETURNING id", body.Id, "email").Scan(&authProviderId)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create auth provider", "detail": err.Error()})
			return
		}

		err = tx.Commit(ctx)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to commit transaction"})
			return
		}

		token, err := authUtils.GenerateJWT(body.Id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to generate token"})
			return
		}

		// c.SetSameSite(http.SameSiteLaxMode)
		// set cookie
		c.SetCookie(
			"token",
			token,
			3600*24,
			"/",
			"",
			isProduction,
			true,
		)

		c.JSON(200, gin.H{
			"message": "User created successfully",
			"user": gin.H{
				"id":               body.Id,
				"name":             body.Name,
				"email":            body.Email,
				"auth_provider_id": authProviderId,
			},
		})
	}
}

func Login() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		var body struct {
			Email    string `json:"email" validate:"required,email"`
			Password string `json:"password" validate:"required,min=6"`
		}

		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body"})
			return
		}

		err := validate.Struct(body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid request body", "detail": err.Error()})
			return
		}

		var User struct {
			Id              string `json:"id"`
			Name            string `json:"name"`
			Email           string `json:"email"`
			Password        string `json:"password"`
		}

		err = database.Pool.QueryRow(ctx, "SELECT id, password, name, email FROM users WHERE email = $1", body.Email).Scan(&User.Id, &User.Password, &User.Name, &User.Email)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "User not found", "details": err.Error()})
			return
		}

		// 🔐 check password
		err = authUtils.CheckPassword(User.Password, body.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Wrong password, Try another password"})
			return
		}

		// 🔐 generate JWT
		token, err := authUtils.GenerateJWT(User.Id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to generate token"})
			return
		}

		// 🍪 set cookie
		// c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(
			"token",
			token,
			3600*24,
			"/",
			"",
			isProduction,
			true,
		)

		c.JSON(200, gin.H{
			"message": "Login successful",
			"user": gin.H{
				"id":              User.Id,
				"name":            User.Name,
				"email":           User.Email,
			},
		})
	}
}

// ========== GOOGLE OAUTH =========== //
func GoogleLogin() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		url := oauth.GoogleOAuthConfig.AuthCodeURL("randomstate")

		c.Redirect(302, url)
	}
}

func GoogleCallback() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		code := c.Query("code")

		token, err := oauth.GoogleOAuthConfig.Exchange(ctx, code)
		if err != nil {
			c.JSON(500, gin.H{"message": "OAuth failed"})
			return
		}

		client := oauth.GoogleOAuthConfig.Client(ctx, token)

		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to get user info"})
			return
		}

		defer resp.Body.Close()

		var userInfo map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
			c.JSON(500, gin.H{"message": "Failed to parse user info"})
			return
		}

		email, ok := userInfo["email"].(string)
		if !ok {
			c.JSON(500, gin.H{"message": "Invalid email from Google"})
			return
		}
		name, ok := userInfo["name"].(string)
		if !ok {
			c.JSON(500, gin.H{"message": "Invalid name from Google"})
			return
		}
		picture, ok := userInfo["picture"].(string)
		if !ok {
			c.JSON(500, gin.H{"message": "Invalid picture from Google"})
			return
		}

		// START TRANSACTION
		tx, err := database.Pool.Begin(ctx)
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to start transaction"})
			return
		}

		defer tx.Rollback(ctx)

		var id string

		// 🔥 create or find user in DB
		err = tx.QueryRow(ctx, `
				INSERT INTO users (name, email, profile_picture)
				VALUES ($1, $2, $3)
				ON CONFLICT (email)
				DO UPDATE SET name = EXCLUDED.name,
											profile_picture = EXCLUDED.profile_picture
				RETURNING id
		`, name, email, picture).Scan(&id)

		if err != nil {
			c.JSON(500, gin.H{"message": "database message", "detail": err.Error()})
			return
		}

		_, err = tx.Exec(ctx, `
				INSERT INTO auth_providers (user_id, provider)
				VALUES ($1, $2)
				ON CONFLICT (user_id, provider) DO NOTHING
		`, id, "google")
		if err != nil {
			c.JSON(500, gin.H{"message": "Failed to create auth provider"})
			return
		}

		if err = tx.Commit(ctx); err != nil {
			c.JSON(500, gin.H{"message": "Failed to commit transaction"})
			return
		}

		// // 🔐 generate JWT
		tokenString, err := authUtils.GenerateJWT(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to generate token"})
			return
		}

		// 🍪 set cookie
		// c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie(
			"token",
			tokenString,
			3600*24,
			"/",
			"",
			isProduction, // secure (true in prod)
			true,         // httpOnly
		)

		frontendUrl := os.Getenv("FRONTEND_URL")

		c.Redirect(302, frontendUrl)
	}
}


// add profile picture after registration/login
func AddProfilePicture() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
		defer cancel()

		userId := c.GetString("userId")
		if userId == "" {
			c.JSON(401, gin.H{"message": "Unauthorized"})
			return
		}

		file, err := c.FormFile("profile_picture")
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
			Folder:    "profile_pictures",
			PublicID:  userId,
			Overwrite: api.Bool(true),
		})
		if err != nil {
			c.JSON(500, gin.H{"message": "Cloudinary upload failed", "detail": err.Error()})
			return
		}

		imageUrl := uploadResult.SecureURL

		_, err = database.Pool.Exec(ctx,
			"UPDATE users SET profile_picture = $1 WHERE id = $2",
			imageUrl, userId,
		)
		if err != nil {
			c.JSON(500, gin.H{"message": "DB update failed", "detail": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"message":          "Profile picture updated",
			"profile_picture": imageUrl,
		})
	}
}
