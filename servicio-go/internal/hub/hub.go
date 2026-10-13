package hub

import (
	"context"
	"encoding/json"
	"log"
	"reflect"
)

const eventBuffer = 256

type Hub struct {
	register   chan *Client
	unregister chan *Client
	events     chan Event
	replace    chan []Space
	queries    chan chan []Space
	clients    map[*Client]struct{}
	spaces     map[int]Space
}

func New() *Hub {
	return &Hub{
		register:   make(chan *Client),
		unregister: make(chan *Client),
		events:     make(chan Event, eventBuffer),
		replace:    make(chan []Space, 1),
		queries:    make(chan chan []Space),
		clients:    make(map[*Client]struct{}),
		spaces:     make(map[int]Space),
	}
}

func (h *Hub) Register(client *Client) {
	h.register <- client
}

func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

func (h *Hub) Apply(event Event) {
	h.events <- event
}

func (h *Hub) Replace(spaces []Space) {
	h.replace <- spaces
}

func (h *Hub) Snapshot() []Space {
	reply := make(chan []Space, 1)
	h.queries <- reply
	return <-reply
}

func (h *Hub) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			for client := range h.clients {
				close(client.send)
				delete(h.clients, client)
			}
			return
		case client := <-h.register:
			h.clients[client] = struct{}{}
			h.sendInitialState(client)
		case client := <-h.unregister:
			h.remove(client)
		case event := <-h.events:
			h.handleEvent(event)
		case spaces := <-h.replace:
			h.handleReplace(spaces)
		case reply := <-h.queries:
			reply <- sortedSpaces(h.spaces)
		}
	}
}

func (h *Hub) remove(client *Client) {
	if _, exists := h.clients[client]; exists {
		delete(h.clients, client)
		close(client.send)
	}
}

func (h *Hub) sendInitialState(client *Client) {
	spaces := sortedSpaces(h.spaces)
	for _, payload := range [][]byte{
		encode(Message{Type: "snapshot", Data: spaces}),
		encode(Message{Type: "occupancy", Data: ComputeOccupancy(spaces)}),
	} {
		select {
		case client.send <- payload:
		default:
		}
	}
}

func (h *Hub) handleEvent(event Event) {
	applyEvent(h.spaces, event)
	update := SpaceUpdate{
		SpaceID:     event.SpaceID,
		SpaceCode:   event.SpaceCode,
		Status:      event.Status,
		Plate:       h.spaces[event.SpaceID].Plate,
		VehicleType: event.VehicleType,
		StatusSince: event.StatusSince,
		OccurredAt:  event.OccurredAt,
	}
	h.broadcast(encode(Message{Type: "space_update", Data: update}))
	spaces := sortedSpaces(h.spaces)
	if isStructural(event.Type) {
		h.broadcast(encode(Message{Type: "snapshot", Data: spaces}))
	}
	h.broadcast(encode(Message{Type: "occupancy", Data: ComputeOccupancy(spaces)}))
}

func (h *Hub) handleReplace(spaces []Space) {
	next := make(map[int]Space, len(spaces))
	for _, space := range spaces {
		next[space.ID] = space
	}
	if reflect.DeepEqual(next, h.spaces) {
		return
	}
	h.spaces = next
	sorted := sortedSpaces(h.spaces)
	h.broadcast(encode(Message{Type: "snapshot", Data: sorted}))
	h.broadcast(encode(Message{Type: "occupancy", Data: ComputeOccupancy(sorted)}))
}

func (h *Hub) broadcast(payload []byte) {
	if payload == nil {
		return
	}
	for client := range h.clients {
		select {
		case client.send <- payload:
		default:
			h.remove(client)
		}
	}
}

func encode(message Message) []byte {
	payload, err := json.Marshal(message)
	if err != nil {
		log.Printf("failed to encode %s message: %v", message.Type, err)
		return nil
	}
	return payload
}
