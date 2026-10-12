package store

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

const (
	maxConnectAttempts = 30
	connectRetryDelay  = 2 * time.Second
	pingTimeout        = 5 * time.Second
)

type Store struct {
	client   *mongo.Client
	database *mongo.Database
}

func Connect(uri, databaseName string) (*Store, error) {
	var lastErr error
	for attempt := 1; attempt <= maxConnectAttempts; attempt++ {
		store, err := tryConnect(uri, databaseName)
		if err == nil {
			log.Println("connected to MongoDB")
			return store, nil
		}
		lastErr = err
		log.Printf("MongoDB connection attempt %d/%d failed: %v", attempt, maxConnectAttempts, err)
		if attempt < maxConnectAttempts {
			time.Sleep(connectRetryDelay)
		}
	}
	return nil, lastErr
}

func tryConnect(uri, databaseName string) (*Store, error) {
	client, err := mongo.Connect(options.Client().ApplyURI(uri).SetServerSelectionTimeout(3 * time.Second))
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), pingTimeout)
	defer cancel()
	if err := client.Ping(ctx, readpref.Primary()); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, err
	}
	return &Store{client: client, database: client.Database(databaseName)}, nil
}

func (s *Store) Database() *mongo.Database {
	return s.database
}

func (s *Store) Ping(ctx context.Context) error {
	return s.client.Ping(ctx, readpref.Primary())
}

func (s *Store) Close(ctx context.Context) error {
	return s.client.Disconnect(ctx)
}
