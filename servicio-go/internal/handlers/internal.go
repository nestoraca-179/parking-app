package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"realtime-service/internal/hub"
	"realtime-service/internal/store"
)

func CreateEvent(state *hub.Hub, events *store.EventStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		var event hub.Event
		if err := c.ShouldBindJSON(&event); err != nil {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Request body is not a valid event")
			return
		}
		if !hub.IsValidEventType(event.Type) || event.SpaceID < 1 || !hub.IsValidStatus(event.Status) {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "type, spaceId and status are required and must be valid")
			return
		}
		if event.OccurredAt.IsZero() {
			event.OccurredAt = time.Now().UTC()
		}
		state.Apply(event)
		document := store.SpaceEvent{
			Type:        event.Type,
			SpaceID:     event.SpaceID,
			SpaceCode:   event.SpaceCode,
			Status:      event.Status,
			Plate:       event.Plate,
			VehicleType: event.VehicleType,
			OccurredAt:  event.OccurredAt,
		}
		if err := events.Insert(c.Request.Context(), document); err != nil {
			log.Printf("failed to persist event: %v", err)
			respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Unexpected server error")
			return
		}
		c.JSON(http.StatusAccepted, gin.H{"status": "accepted"})
	}
}
