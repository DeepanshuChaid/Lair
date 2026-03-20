package client

import (
	"github.com/gorilla/websocket"
)

type Client struct { 
	ID string
	Conn *websocket.Conn
	RoomID string
	Send chan []byte
}