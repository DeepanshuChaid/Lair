package main

import (
	"log"
	"os"

	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/DeepanshuChaid/Lair/internals/middlewares/authMiddleware"
	"github.com/gin-gonic/gin"

	"github.com/DeepanshuChaid/Lair/internals/controllers/authController"

	"github.com/joho/godotenv"
)

func main () {
  // Load .env if present; ignore error if file not found (env vars set externally)
  godotenv.Load()

  database.Connect()

  log.Println(os.Getenv("NEON_DATABASE_URL"))

  PORT := os.Getenv("PORT")

  router := gin.Default()

  router.GET("/", func(c *gin.Context) {
    c.JSON(200, gin.H{
      "message": "Hi USER",
    })
  })

  // Public routes
  authRoutes := router.Group("/auth")

  authRoutes.POST("/register", authController.Register())
  authRoutes.POST("/login", authController.Login())

  
  // google oauth
  authRoutes.GET("/google", authController.GoogleLogin())
  authRoutes.GET("/google/callback", authController.GoogleCallback())
  

  // Protected routes
  protectedRoutes := router.Group("/api")
  protectedRoutes.Use(authMiddleware.AuthMiddleware())
  protectedRoutes.GET("/user", func(ctx *gin.Context) {
    
  })

  router.Run(":" + PORT)
}