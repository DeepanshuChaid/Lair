package main

import (
	"fmt"
	"net/http"

	"github.com/DeepanshuChaid/Lair/websocket/client"
	"github.com/DeepanshuChaid/Lair/websocket/hub"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
  CheckOrigin: func(r *http.Request) bool {
    return true
  },
}

func serveWS(h *hub.Hub, c *gin.Context) {
  roomName := c.Param("roomName")

  room := h.CreateRoom(roomName)

  conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
  
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
  }

  client := &client.Client{
    Conn: conn,
    Room: room,
    Send: make(chan []byte),
  }

  room.Register <- client

  go client.ReadPump()
}

func main () {
  fmt.Println("hello world")
}