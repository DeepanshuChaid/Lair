package middleware

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
    claims, err := authutils.VerifyJWT(token)
    if err != nil {
      c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
      c.Abort()
      return
    }

    // 🧠 attach user to context
    c.Set("userId", claims.UserID)

    c.Next()
  }
}