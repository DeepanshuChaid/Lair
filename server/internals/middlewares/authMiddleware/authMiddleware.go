package authMiddleware

import (
  "net/http"

  "github.com/DeepanshuChaid/Lair/internals/utils/authUtils"
  "github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
  return func(c *gin.Context) {

    // 🍪 get cookie
    token, err := c.Cookie("token")
    if err != nil {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
      c.Abort()
      return
    }

    // 🔐 verify JWT
    claims, err := authUtils.VerifyJWT(token)
    if err != nil {
      c.JSON(401, gin.H{"error": "Invalid token"})
      c.Abort()
      return
    }

    // 👇 extract user id
    userId, ok := claims["user_id"].(string)
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token payload"})
        c.Abort()
        return
    }

    // attach to context
    c.Set("userId", userId)

    c.Next()
  }
}