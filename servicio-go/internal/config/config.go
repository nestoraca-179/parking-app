package config

import (
	"errors"
	"net/url"
	"os"
	"strings"
)

const defaultDatabase = "realtime_db"

type Config struct {
	Port          string
	MongoURI      string
	MongoDatabase string
	JWTSecret     string
	ParkingURL    string
}

func Load() (Config, error) {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		return Config{}, errors.New("JWT_SECRET must have at least 32 characters")
	}
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		return Config{}, errors.New("MONGO_URI is required")
	}
	return Config{
		Port:          valueOrDefault("PORT", "8081"),
		MongoURI:      mongoURI,
		MongoDatabase: databaseName(mongoURI),
		JWTSecret:     secret,
		ParkingURL:    strings.TrimRight(valueOrDefault("PARKING_URL", "http://parking-service:8000"), "/"),
	}, nil
}

func valueOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func databaseName(uri string) string {
	parsed, err := url.Parse(uri)
	if err != nil {
		return defaultDatabase
	}
	name := strings.TrimPrefix(parsed.Path, "/")
	if name == "" {
		return defaultDatabase
	}
	return name
}
