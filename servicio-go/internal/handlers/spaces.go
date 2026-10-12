package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"realtime-service/internal/hub"
)

func Spaces(state *hub.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, state.Snapshot())
	}
}
