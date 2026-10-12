package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"realtime-service/internal/auth"
	"realtime-service/internal/config"
	"realtime-service/internal/handlers"
	"realtime-service/internal/hub"
	"realtime-service/internal/parkingclient"
	"realtime-service/internal/store"
)

const (
	firstSyncRetryDelay = 5 * time.Second
	syncInterval        = 30 * time.Second
	snapshotInterval    = 60 * time.Second
	shutdownTimeout     = 5 * time.Second
)

func main() {
	settings, err := config.Load()
	if err != nil {
		log.Fatalf("invalid configuration: %v", err)
	}

	database, err := store.Connect(settings.MongoURI, settings.MongoDatabase)
	if err != nil {
		log.Fatalf("could not connect to MongoDB: %v", err)
	}
	events, err := store.NewEventStore(database.Database())
	if err != nil {
		log.Fatalf("could not prepare space_events: %v", err)
	}
	snapshots, err := store.NewSnapshotStore(database.Database())
	if err != nil {
		log.Fatalf("could not prepare occupancy_snapshots: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	state := hub.New()
	go state.Run(ctx)
	parking := parkingclient.New(settings.ParkingURL, settings.JWTSecret)
	go runParkingSync(ctx, parking, state)
	go runOccupancySnapshots(ctx, state, snapshots)

	server := &http.Server{
		Addr:              ":" + settings.Port,
		Handler:           buildRouter(settings, state, database, events, snapshots),
		ReadHeaderTimeout: 5 * time.Second,
	}
	go func() {
		log.Printf("realtime-service listening on port %s", settings.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server failed: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownContext, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	_ = server.Shutdown(shutdownContext)
	_ = database.Close(shutdownContext)
}

func buildRouter(settings config.Config, state *hub.Hub, database *store.Store, events *store.EventStore, snapshots *store.SnapshotStore) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(requestLogger())

	router.GET("/health", handlers.Health(database))
	router.GET("/ws/spaces", handlers.Websocket(state, settings.JWTSecret))

	api := router.Group("/api/realtime")
	api.Use(auth.Authenticate(settings.JWTSecret), auth.RequireRoles(auth.RoleAdmin, auth.RoleOperator))
	api.GET("/spaces", handlers.Spaces(state))
	api.GET("/occupancy", handlers.Occupancy(state, snapshots))
	api.GET("/events", handlers.Events(events))

	internal := router.Group("/internal/realtime")
	internal.Use(auth.Authenticate(settings.JWTSecret), auth.RequireRoles(auth.RoleService))
	internal.POST("/events", handlers.CreateEvent(state, events))

	router.NoRoute(handlers.NotFound)
	return router
}

func requestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()
		if c.Request.URL.Path == "/health" {
			return
		}
		log.Printf("%s %s %d %dms", c.Request.Method, c.Request.URL.Path, c.Writer.Status(), time.Since(startedAt).Milliseconds())
	}
}

func runParkingSync(ctx context.Context, parking *parkingclient.Client, state *hub.Hub) {
	synced := false
	for {
		fetchContext, cancel := context.WithTimeout(ctx, 10*time.Second)
		spaces, err := parking.FetchSpaces(fetchContext)
		cancel()
		if err != nil {
			log.Printf("parking sync failed: %v", err)
		} else {
			state.Replace(spaces)
			synced = true
		}
		wait := syncInterval
		if !synced {
			wait = firstSyncRetryDelay
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(wait):
		}
	}
}

func runOccupancySnapshots(ctx context.Context, state *hub.Hub, snapshots *store.SnapshotStore) {
	ticker := time.NewTicker(snapshotInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			occupancy := hub.ComputeOccupancy(state.Snapshot())
			if occupancy.Total == 0 {
				continue
			}
			err := snapshots.Insert(ctx, store.OccupancySnapshot{
				CapturedAt:  time.Now().UTC(),
				Total:       occupancy.Total,
				Occupied:    occupancy.Occupied,
				Free:        occupancy.Free,
				Maintenance: occupancy.Maintenance,
			})
			if err != nil {
				log.Printf("failed to store occupancy snapshot: %v", err)
			}
		}
	}
}
