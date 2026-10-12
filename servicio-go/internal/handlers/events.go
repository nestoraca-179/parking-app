package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"realtime-service/internal/store"
)

const (
	defaultEventLimit = 50
	maxEventLimit     = 200
)

func Events(events *store.EventStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit, err := strconv.Atoi(c.DefaultQuery("limit", strconv.Itoa(defaultEventLimit)))
		if err != nil || limit < 1 || limit > maxEventLimit {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "limit must be between 1 and 200")
			return
		}
		result, err := events.Recent(c.Request.Context(), limit)
		if err != nil {
			log.Printf("failed to read events: %v", err)
			respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Unexpected server error")
			return
		}
		c.JSON(http.StatusOK, result)
	}
}
