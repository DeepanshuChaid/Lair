package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main(){
  err := godotenv.Load()
  if err != nil {
    log.Fatal("Error loading .env file")
  }
  
  r := gin.Default()

  r.GET("/", func(c *gin.Context){
    c.JSON(200, gin.H{
      "message": "Hello World",
    })
  })

  PORT := os.Getenv("PORT")

  r.Run(":" + PORT)
}