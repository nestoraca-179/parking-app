package store

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type OccupancySnapshot struct {
	CapturedAt  time.Time `json:"capturedAt" bson:"capturedAt"`
	Total       int       `json:"total" bson:"total"`
	Occupied    int       `json:"occupied" bson:"occupied"`
	Free        int       `json:"free" bson:"free"`
	Maintenance int       `json:"maintenance" bson:"maintenance"`
}

type SnapshotStore struct {
	collection *mongo.Collection
}

func NewSnapshotStore(database *mongo.Database) (*SnapshotStore, error) {
	collection := database.Collection("occupancy_snapshots")
	index := mongo.IndexModel{Keys: bson.D{{Key: "capturedAt", Value: -1}}}
	ctx, cancel := context.WithTimeout(context.Background(), pingTimeout)
	defer cancel()
	if _, err := collection.Indexes().CreateOne(ctx, index); err != nil {
		return nil, err
	}
	return &SnapshotStore{collection: collection}, nil
}

func (s *SnapshotStore) Insert(ctx context.Context, snapshot OccupancySnapshot) error {
	_, err := s.collection.InsertOne(ctx, snapshot)
	return err
}

func (s *SnapshotStore) Since(ctx context.Context, since time.Time) ([]OccupancySnapshot, error) {
	filter := bson.M{"capturedAt": bson.M{"$gte": since}}
	findOptions := options.Find().SetSort(bson.D{{Key: "capturedAt", Value: 1}})
	cursor, err := s.collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	snapshots := make([]OccupancySnapshot, 0)
	if err := cursor.All(ctx, &snapshots); err != nil {
		return nil, err
	}
	for index := range snapshots {
		snapshots[index].CapturedAt = snapshots[index].CapturedAt.UTC()
	}
	return snapshots, nil
}
