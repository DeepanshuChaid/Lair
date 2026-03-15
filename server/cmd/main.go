package main

import (
  "log"
  "net/http"
  "os"

  "github.com/gin-contrib/cors"
  "github.com/gin-gonic/gin"
  "github.com/gorilla/websocket"
  "github.com/joho/godotenv"
)

var upgrader = websocket.Upgrader{
  CheckOrigin: func(r *http.Request) bool {
    return true
  },
}

func wsHandler(c *gin.Context) {
  conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
  if err != nil {
    log.Println("WebSocket upgrade error:", err)
    return
  }
  defer conn.Close()

  for {
    messageType, message, err := conn.ReadMessage()
    if err != nil {
      log.Println("Error reading message:", err)
      break
    }

    err = conn.WriteMessage(messageType, message)
    if err != nil {
      log.Println("Error writing message:", err)
      break
    }
  }
}

func main() {
  err := godotenv.Load()
  if err != nil {
    log.Println(".env not found")
  }

  PORT := os.Getenv("PORT")
  if PORT == "" {
    PORT = "8080"
  }

  router := gin.Default()

  router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{"http://localhost:3000"},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Content-Type"},
    AllowCredentials: true,
  }))

  router.GET("/", func(c *gin.Context) {
    c.String(200, "Hello World")
  })

  router.GET("/ws", wsHandler)

  log.Println("Server running on port:", PORT)

  if err := router.Run(":" + PORT); err != nil {
    log.Fatal("Error starting server:", err)
  }
}