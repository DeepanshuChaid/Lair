package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"

	"github.com/DeepanshuChaid/Lair/internals/cloudinary"
	"github.com/DeepanshuChaid/Lair/internals/database"
	"github.com/DeepanshuChaid/Lair/internals/middlewares/authMiddleware"
	"github.com/DeepanshuChaid/Lair/internals/oauth"
	cache "github.com/DeepanshuChaid/Lair/internals/redis"
	"github.com/DeepanshuChaid/Lair/internals/websocket"
	"github.com/gin-gonic/gin"

	"github.com/DeepanshuChaid/Lair/internals/controllers/authController"
	"github.com/DeepanshuChaid/Lair/internals/controllers/roomController"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present; ignore error if file not found (env vars set externally)
	godotenv.Load()
	oauth.InitGoogleOAuth()

	redisURL := os.Getenv("REDIS_URL")
	if err := cache.Init(redisURL); err != nil {
		log.Fatal("Redis connection failed:", err)
	}

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

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run() // background goruntines bascically background functions running on diff thread

	PORT := os.Getenv("PORT")

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("FRONTEND_URL")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		AllowCredentials: true,
	}))

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hi USER",
		})
	})

	// Public routes
	authRoutes := router.Group("/auth")
	authRoutes.POST("/register", authController.Register())
	authRoutes.POST("/login", authController.Login())
	authRoutes.GET("/google", authController.GoogleLogin())
	authRoutes.GET("/google/callback", authController.GoogleCallback())
	authRoutes.POST("/logout", authController.Logout())

	// Protected routes
	protectedRoutes := router.Group("/api")
	protectedRoutes.Use(authMiddleware.AuthMiddleware())
	protectedRoutes.GET("/user", authController.GetUser())
	protectedRoutes.POST("/add/profile-picture", authController.AddProfilePicture())

	// Room routes
	protectedRoutes.GET("/room/get", roomController.GetUserRooms())
	protectedRoutes.POST("/room/create", roomController.CreateRoom())
	protectedRoutes.DELETE("/room/delete/:id", roomController.DeleteRoom())
	protectedRoutes.PUT("/room/update/:id", roomController.UpdateRoom())
	protectedRoutes.POST("/room/uploadthumbnail/:id", roomController.UpdateRoomThumbnail())

	// webscocket route
	protectedRoutes.POST("/ws/add-member/:roomId", websocket.AddMember())
	protectedRoutes.DELETE("/ws/remove-member/:roomId", websocket.RemoveMember(hub))
	protectedRoutes.GET("/ws/verify/:roomId", websocket.VerfiyRoom())
	protectedRoutes.GET("/ws/:roomId", websocket.ServerWs(hub))

	router.Run(":" + PORT)
}
