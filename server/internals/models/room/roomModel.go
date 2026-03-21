package roomModel

import "time"

type Room struct {
	ID          string `json:"id"`
	OwnerId     string `json:"ownerId"`
	Title       string `json:"title"`
	Description string `json:"description"`

	IsPublic bool `json:"isPublic"`

	Thumbnail string `json:"thumbnail"`

	Version int `json:"version"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RoomMember struct {
	ID	 string `json:"id"`
	RoomId string `json:"roomId"`
	UserId string `json:"userId"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RoomState struct {
	ID string `json:"id"`
	RoomId string `json:"roomId"`
	
	State string `json:"state"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// func (rs *RoomState) UpdateState(newState string) {
// 	bytes, ok := value.([]byte)
// 	if !ok {
// 		// Handle error
// 		return
// 	}
// 	// Update the state with the new value
// 	rs.State = string(bytes)
// }