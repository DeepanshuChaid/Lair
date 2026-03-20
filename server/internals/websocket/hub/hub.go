package hub


type Hub struct {
	Rooms map[string]*room.Room
}

func NewHub() *Hub {
	return &Hub{
		Rooms: make(map[string]*room.Room),
	}
}