package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"realtime-service/internal/hub"
	"realtime-service/internal/store"
)

const (
	defaultOccupancyMinutes = 60
	maxOccupancyMinutes     = 10080
)

func Occupancy(state *hub.Hub, snapshots *store.SnapshotStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		minutes, err := strconv.Atoi(c.DefaultQuery("minutes", strconv.Itoa(defaultOccupancyMinutes)))
		if err != nil || minutes < 1 || minutes > maxOccupancyMinutes {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "minutes must be between 1 and 10080")
			return
		}
		since := time.Now().Add(-time.Duration(minutes) * time.Minute)
		series, err := snapshots.Since(c.Request.Context(), since)
		if err != nil {
			log.Printf("failed to read occupancy series: %v", err)
			respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Unexpected server error")
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"current": hub.ComputeOccupancy(state.Snapshot()),
			"series":  series,
		})
	}
}
