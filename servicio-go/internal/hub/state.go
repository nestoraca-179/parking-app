package hub

import (
	"sort"
	"time"
)

const (
	StatusFree        = "FREE"
	StatusOccupied    = "OCCUPIED"
	StatusMaintenance = "MAINTENANCE"

	EventEntry        = "ENTRY"
	EventExit         = "EXIT"
	EventSpaceCreated = "SPACE_CREATED"
	EventSpaceUpdated = "SPACE_UPDATED"
	EventSpaceDeleted = "SPACE_DELETED"
)

type Space struct {
	ID          int        `json:"id"`
	Code        string     `json:"code"`
	Zone        string     `json:"zone"`
	RowIndex    int        `json:"rowIndex"`
	ColIndex    int        `json:"colIndex"`
	VehicleType string     `json:"vehicleType"`
	Status      string     `json:"status"`
	Plate       *string    `json:"plate"`
	StatusSince *time.Time `json:"statusSince"`
}

type Occupancy struct {
	Total       int `json:"total"`
	Occupied    int `json:"occupied"`
	Free        int `json:"free"`
	Maintenance int `json:"maintenance"`
}

type Event struct {
	Type        string     `json:"type"`
	SpaceID     int        `json:"spaceId"`
	SpaceCode   string     `json:"spaceCode"`
	Zone        string     `json:"zone"`
	RowIndex    int        `json:"rowIndex"`
	ColIndex    int        `json:"colIndex"`
	Status      string     `json:"status"`
	Plate       *string    `json:"plate"`
	VehicleType string     `json:"vehicleType"`
	StatusSince *time.Time `json:"statusSince"`
	OccurredAt  time.Time  `json:"occurredAt"`
}

type Message struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type SpaceUpdate struct {
	SpaceID     int        `json:"spaceId"`
	SpaceCode   string     `json:"spaceCode"`
	Status      string     `json:"status"`
	Plate       *string    `json:"plate"`
	VehicleType string     `json:"vehicleType"`
	StatusSince *time.Time `json:"statusSince"`
	OccurredAt  time.Time  `json:"occurredAt"`
}

func IsValidEventType(eventType string) bool {
	switch eventType {
	case EventEntry, EventExit, EventSpaceCreated, EventSpaceUpdated, EventSpaceDeleted:
		return true
	default:
		return false
	}
}

func IsValidStatus(status string) bool {
	switch status {
	case StatusFree, StatusOccupied, StatusMaintenance:
		return true
	default:
		return false
	}
}

func isStructural(eventType string) bool {
	return eventType == EventSpaceCreated || eventType == EventSpaceUpdated || eventType == EventSpaceDeleted
}

func ComputeOccupancy(spaces []Space) Occupancy {
	occupancy := Occupancy{Total: len(spaces)}
	for _, space := range spaces {
		switch space.Status {
		case StatusOccupied:
			occupancy.Occupied++
		case StatusFree:
			occupancy.Free++
		case StatusMaintenance:
			occupancy.Maintenance++
		}
	}
	return occupancy
}

func sortedSpaces(spaces map[int]Space) []Space {
	list := make([]Space, 0, len(spaces))
	for _, space := range spaces {
		list = append(list, space)
	}
	sort.Slice(list, func(i, j int) bool {
		if list[i].RowIndex != list[j].RowIndex {
			return list[i].RowIndex < list[j].RowIndex
		}
		if list[i].ColIndex != list[j].ColIndex {
			return list[i].ColIndex < list[j].ColIndex
		}
		return list[i].ID < list[j].ID
	})
	return list
}

func applyEvent(spaces map[int]Space, event Event) {
	if event.Type == EventSpaceDeleted {
		delete(spaces, event.SpaceID)
		return
	}
	plate := event.Plate
	if event.Status != StatusOccupied {
		plate = nil
	}
	spaces[event.SpaceID] = Space{
		ID:          event.SpaceID,
		Code:        event.SpaceCode,
		Zone:        event.Zone,
		RowIndex:    event.RowIndex,
		ColIndex:    event.ColIndex,
		VehicleType: event.VehicleType,
		Status:      event.Status,
		Plate:       plate,
		StatusSince: event.StatusSince,
	}
}
