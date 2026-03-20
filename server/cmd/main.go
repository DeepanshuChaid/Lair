package main

import (
	"fmt"
	"log"
	"os"

	"github.com/DeepanshuChaid/Lair/internals/cloudinary"
	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/DeepanshuChaid/Lair/internals/middlewares/authMiddleware"
	"github.com/DeepanshuChaid/Lair/internals/oauth"
	"github.com/gin-gonic/gin"

	"github.com/DeepanshuChaid/Lair/internals/controllers/authController"

	"github.com/joho/godotenv"
)

func main () {
  // Load .env if present; ignore error if file not found (env vars set externally)
  godotenv.Load()
  oauth.InitGoogleOAuth()

  // cloudinary init
  err := cloudinary.InitCloudinary(
    os.Getenv("CLOUDINARY_CLOUD_NAME"),
    os.Getenv("CLOUDINARY_API_KEY"),
    os.Getenv("CLOUDINARY_API_SECRET"),
  )
  if err != nil {
    log.Fatalf("Failed to initialize Cloudinary: %v", err)
  }

  database.Connect()

  log.Println(os.Getenv("NEON_DATABASE_URL"))
  fmt.Println(os.Getenv("JWT_SECRET"))
  fmt.Println("CLIENT ID:", os.Getenv("GOOGLE_CLIENT_ID"))

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
  protectedRoutes.GET("/user", func(c *gin.Context) {
    c.JSON(200, gin.H{
      "message": "Hi USER the auth middleware works i guess",
    })
  })

  router.Run(":" + PORT)
}