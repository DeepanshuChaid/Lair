package authController

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"time"

	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/DeepanshuChaid/Lair/internals/oauth"
	"github.com/DeepanshuChaid/Lair/internals/utils/authUtils"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

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
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		err := validate.Struct(body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "detail": err.Error()})
			return
		}

		// 🔐 hash password
		hashedPassword, err := authUtils.HashPassword(body.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		tx, err := database.Pool.Begin(ctx)
		if err != nil {
				c.JSON(500, gin.H{"error": "Failed to start transaction"})
				return
		}
		
		defer tx.Rollback(ctx) // safe rollback if something fails
		
		err = tx.QueryRow(ctx, "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id", body.Name, body.Email, hashedPassword).Scan(&body.Id)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create user", "detail": err.Error()})
			return
		}

		var authProviderId string

		err = tx.QueryRow(ctx, "INSERT INTO auth_providers (user_id, provider) VALUES ($1, $2) RETURNING id", body.Id, "email").Scan(&authProviderId)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to create auth provider", "detail": err.Error()})
			return
		}

		err = tx.Commit(ctx)
		if err != nil 	{
			c.JSON(500, gin.H{"error": "Failed to commit transaction"})
			return
		}

		c.JSON(200, gin.H{
			"message": "User created successfully",
			"user": gin.H{
				"id":    body.Id,
				"name":  body.Name,
				"email": body.Email,
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
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		err := validate.Struct(body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "detail": err.Error()})
			return
		}

		var User struct {
			Id              string `json:"id"`
			Name            string `json:"name"`
			Email           string `json:"email"`
			Password        string `json:"password"`
			Profile_picture string `json:"profile_picture"`
		}

		err = database.Pool.QueryRow(ctx, "SELECT id, name, password,  email, profile_picture FROM users WHERE email = $1", body.Email).Scan(&User.Id, &User.Name, &User.Password, &User.Email, &User.Profile_picture)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		// 🔐 check password
		err = authUtils.CheckPassword(User.Password, body.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong password, Try another password"})
			return
		}

		// 🔐 generate JWT
		token, err := authUtils.GenerateJWT(User.Id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// 🍪 set cookie
		c.SetCookie(
			"token",
			token,
			3600*24,
			"/",
			"",
			false,
			true,
		)

		c.JSON(200, gin.H{
			"message": "Login successful",
			"user": gin.H{
				"id":              User.Id,
				"name":            User.Name,
				"email":           User.Email,
				"profile_picture": User.Profile_picture,
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

		token, err := oauth.GoogleOAuthConfig.Exchange(context.Background(), code)
		if err != nil {
			c.JSON(500, gin.H{"error": "OAuth failed"})
			return
		}

		client := oauth.GoogleOAuthConfig.Client(context.Background(), token)

		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to get user info"})
			return
		}

		defer resp.Body.Close()

		var userInfo map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&userInfo)

		email := userInfo["email"].(string)
		name := userInfo["name"].(string)
		picture := userInfo["picture"].(string)

		// START TRANSACTION
		tx, err := database.Pool.Begin(ctx)
		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to start transaction"})
			return
		}

		var id string

		// 🔥 create or find user in DB
		err = tx.QueryRow(ctx, "INSERT INTO users (name, email, profile_picture) VALUES ($1, $2, $3) RETURNING id", name, email, picture).Scan(&id)
		if err != nil {
			c.JSON(500, gin.H{"message": "database error", "detail": err.Error()})
			return 
		}

		var authProviderId string

		err = tx.QueryRow(ctx, "INSERT INTO auth_providers (user_id, provider) VALUES ($1, $2) RETURNING id", id, "google").Scan(&authProviderId)

		if err = tx.Commit(); err != nil {
			c.JSON(500, gin.H{"error": "Failed to commit transaction"})
			return
		}

		// // 🔐 generate JWT
		tokenString, err := authUtils.GenerateJWT(id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		// 🍪 set cookie
		c.SetCookie(
		  "token",
		  tokenString,
		  3600*24,
		  "/",
		  "",
		  true,  // secure (true in prod)
		  true,  // httpOnly
		)

		frontendUrl := os.Getenv("FRONTEND_URL")

		c.Redirect(302, frontendUrl)
	}
}
