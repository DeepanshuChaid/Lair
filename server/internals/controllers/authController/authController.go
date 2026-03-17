package authController

import (
	"context"
	"net/http"
	"os"

	"time"

	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/DeepanshuChaid/Lair/internals/oauth"
	"github.com/DeepanshuChaid/Lair/internals/utils/authUtils"
	"github.com/gin-gonic/gin"
)

func Register() gin.HandlerFunc {
  return func(c *gin.Context) {
    ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
    defer cancel()

    var body struct {
      name string `json:"name"`
      email string `json:"email"`
      password string `json:"password"`
    }

    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
      return
    }

    // 🔐 hash password
    hashedPassword, err := authutils.HashPassword(body.password)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
      return
    }

    rows, err := database.Pool.Query(ctx, "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id", body.name, body.email, hashedPassword)
    rows.Close()

    if err != nil {
      c.JSON(500, gin.H{"error": "User already exists or DB error"})
      return
    }

    c.JSON(http.StatusOk, gin.H{
      "message": "User created successfully",
      "user": body
    })
  }
}

func Login() gin.HandlerFunc {
  return func(c *gin.Context) {
    var body struct {
      email string `json:"email"`
      password string `json:"password"`
    }

    if err := c.ShouldBindJSON(&body); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
      return
    }

    // 🔐 check password
    err := authutils.CheckPassword(body.password, body.password)
    if err != nil {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Wrong password, Try another password"})
      return
    }

    var User userModel.User

    err = database.Pool.QueryRow(ctx, "SELECT id, name, email, profile_picture FROM users WHERE email = $1", body.email).Scan(&User.Id, &User.Name, &User.Email, &User.Profile_picture)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
      return
    }

    // 🔐 generate JWT
    tokenString, err := authutils.GenerateJWT(User.Id)
    if err != nil {
      c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
      return
    }

    // 🍪 set cookie
    c.SetCookie(
      "auth_token",
      token,
      3600*24,
      "/",
      "",
      false,
      true,
    )

    c.JSON(http.StatusOk, gin.H{
      "message": "Login successful",
      "user": User,
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
      _, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
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

      // var userInfo map[string]interface{}
      // json.NewDecoder(resp.Body).Decode(&userInfo)

      // email := userInfo["email"].(string)
      // name := userInfo["name"].(string)
      // picture := userInfo["picture"].(string)

      // 🔥 create or find user in DB
      // user := findOrCreateUser(email, name, picture)

      // // 🔐 generate JWT
      // tokenString := generateJWT(user.ID)

      // 🍪 set cookie
      // c.SetCookie(
      //   "auth_token",
      //   tokenString,
      //   3600*24,
      //   "/",
      //   "",
      //   true,  // secure (true in prod)
      //   true,  // httpOnly
      // )

      frontendUrl := os.Getenv("FRONTEND_URL")  

      c.Redirect(302, frontendUrl)
    }
}