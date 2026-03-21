package main

import (
	"encoding/json"
	"fmt"
)

type Message struct {
	RoomId  string          `json:"roomId"`
	Type    string          `json:"type"`
	UserId  string          `json:"userId"`
	Content json.RawMessage `json:"content"`
	Version int             `json:"version"`
	SentAt  int64           `json:"sentAt"`
}

func main() {
	msg := []byte(`{"type":"chat","content":{"text": "hello"},"version":1}`)
	var m Message
	err := json.Unmarshal(msg, &m)
	fmt.Printf("err: %v\n", err)
	fmt.Printf("raw bytes: %s\n", string(m.Content))

	out, err := json.Marshal(m)
	fmt.Printf("marshaled out: %s\n", string(out))
}
