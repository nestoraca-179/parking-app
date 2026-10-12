package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"realtime-service/internal/auth"
	"realtime-service/internal/hub"
)

const (
	authWait          = 5 * time.Second
	closeUnauthorized = 4401
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type authMessage struct {
	Type  string `json:"type"`
	Token string `json:"token"`
}

func Websocket(state *hub.Hub, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("websocket upgrade failed: %v", err)
			return
		}
		if !authenticateConnection(conn, jwtSecret) {
			rejectConnection(conn)
			return
		}
		client := hub.NewClient(conn)
		state.Register(client)
		go client.WritePump()
		client.ReadPump()
		state.Unregister(client)
		_ = conn.Close()
	}
}

func authenticateConnection(conn *websocket.Conn, jwtSecret string) bool {
	conn.SetReadLimit(4096)
	_ = conn.SetReadDeadline(time.Now().Add(authWait))
	var message authMessage
	if err := conn.ReadJSON(&message); err != nil || message.Type != "auth" {
		return false
	}
	claims, err := auth.ParseToken(jwtSecret, message.Token)
	if err != nil {
		return false
	}
	return claims.Role == auth.RoleAdmin || claims.Role == auth.RoleOperator
}

func rejectConnection(conn *websocket.Conn) {
	payload := websocket.FormatCloseMessage(closeUnauthorized, "unauthorized")
	_ = conn.WriteControl(websocket.CloseMessage, payload, time.Now().Add(time.Second))
	_ = conn.Close()
}
