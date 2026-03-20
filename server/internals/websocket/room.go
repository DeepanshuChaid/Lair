package websocket

type Room struct {
	ID      string
	Name    string
	OwnerID string
	Clients map[string]*Client
	// State can be any JSON-serializable data structure representing the current state of the room
	State interface{}

	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan []byte
}

func NewRoom(id, name, ownerID string) *Room {
	return &Room{
		ID:         id,
		Name:       name,
		OwnerID:    ownerID,
		Clients:    make(map[string]*Client),
		State:      nil,
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan []byte),
	}
}

func (r *Room) Run() {
	for {
		select {
			case client := <-r.Register:
				r.Clients[client.ID] = client


			case client := <-r.Unregister:
				if _, ok := r.Clients[client.ID]; ok {
					delete(r.Clients, client.ID)
					close(client.Send)
				}


			case message := <-r.Broadcast:
				for _, client := range r.Clients {
					select {
						case client.Send <- message:
						default:
							close(client.Send)
							delete(r.Clients, client.ID)
					}
				}
				
		}
	}
}