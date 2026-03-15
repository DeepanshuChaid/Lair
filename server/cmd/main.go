package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/gorilla/websocket"
)

// THIS CONVERTS THE HTTP CONNECTION TO A WEBSOCKET CONNECTION
// Client: HTTP request
// Server: 101 Switching Protocols
// Connection becomes WebSocket
var upgrader = websocket.Upgrader{
  CheckOrigin: func(r *http.Request) bool {
    return true
  },
}

var clients = make(map[*websocket.Conn]bool)

func handleWS (c *gin.Context) {
  // Upgrade the connection to a websocket connection
  conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)

  clients[conn] = true
  
  if err != nil {
    c.JSON(http.StatusBadRequest, gin.H{
      "error": err.Error(),
    })
    return 
  }

  // Read messages from the client for loop does not hurt because it is a websocket connection basically a persistent connection
  // browser sends message
  // ↓
  // server receives
  // ↓
  // server prints it
  for {
    var msg string

    err := conn.ReadJSON(&msg)
    if err != nil {
      log.Println("Error reading message: ", err)
      delete(clients, conn)
      break
    }

    fmt.Println("Message received: ", msg)

    for client := range clients {
      client.WriteJSON(msg)
    }
    
  }
  
}


func main(){
  err := godotenv.Load()
  if err != nil {
    log.Fatal("Error loading .env file")
  }

  // newMap := map[string]interface{
  //   "key": "value",
  //   "key2": 2,
  // }
  
  router := gin.Default()

  router.GET("/", func(c *gin.Context){
    c.JSON(200, gin.H{
      "message": "Hello World",
    })
  })

  router.GET("/ws", handleWS)

  PORT := os.Getenv("PORT")

  router.Run(":" + PORT)
}