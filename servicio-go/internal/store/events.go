package store

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type SpaceEvent struct {
	Type        string    `json:"type" bson:"type"`
	SpaceID     int       `json:"spaceId" bson:"spaceId"`
	SpaceCode   string    `json:"spaceCode" bson:"spaceCode"`
	Status      string    `json:"status" bson:"status"`
	Plate       *string   `json:"plate" bson:"plate,omitempty"`
	VehicleType string     `json:"vehicleType" bson:"vehicleType"`
	StatusSince *time.Time `json:"statusSince" bson:"statusSince,omitempty"`
	OccurredAt  time.Time  `json:"occurredAt" bson:"occurredAt"`
}

type EventStore struct {
	collection *mongo.Collection
}

func NewEventStore(database *mongo.Database) (*EventStore, error) {
	collection := database.Collection("space_events")
	index := mongo.IndexModel{Keys: bson.D{{Key: "occurredAt", Value: -1}}}
	ctx, cancel := context.WithTimeout(context.Background(), pingTimeout)
	defer cancel()
	if _, err := collection.Indexes().CreateOne(ctx, index); err != nil {
		return nil, err
	}
	return &EventStore{collection: collection}, nil
}

func (s *EventStore) Insert(ctx context.Context, event SpaceEvent) error {
	_, err := s.collection.InsertOne(ctx, event)
	return err
}

func (s *EventStore) Recent(ctx context.Context, limit int) ([]SpaceEvent, error) {
	findOptions := options.Find().SetSort(bson.D{{Key: "occurredAt", Value: -1}}).SetLimit(int64(limit))
	cursor, err := s.collection.Find(ctx, bson.D{}, findOptions)
	if err != nil {
		return nil, err
	}
	events := make([]SpaceEvent, 0, limit)
	if err := cursor.All(ctx, &events); err != nil {
		return nil, err
	}
	for index := range events {
		events[index].OccurredAt = events[index].OccurredAt.UTC()
	}
	return events, nil
}
