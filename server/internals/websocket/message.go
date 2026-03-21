package websocket

import (
	"encoding/json"
	"time"
)

type Message struct {
	RoomId  string  `json:"roomId"`
	Type    string  `json:"type"`
	UserId  string  `json:"userId"`
	Content json.RawMessage `json:"content"`
	Version int     `json:"version"`
	SentAt  int64   `json:"sentAt"`
}

func NewMessage(roomId, userId, msgType string, content interface{}, version int) *Message {
	// marshal bascially converts the content to JSON format, which is a byte slice. We can directly assign it to the Content field of the Message struct.
	contentBytes, _ := json.Marshal(content)
	return &Message{
		RoomId:  roomId,
		Type:    msgType,
		UserId:  userId,
		Content: contentBytes,
		Version: version,
		SentAt:  time.Now().UnixMilli(),
	}
}