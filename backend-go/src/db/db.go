package db

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var client *mongo.Client
var Database *mongo.Database

func Connect() error {
	uri := os.Getenv("MONGO_CONNECTION_STRING")
	if os.Getenv("GO_ENV") == "test" {
		uri = os.Getenv("MONGO_CONNECTION_STRING_TEST")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	client, err = mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}

	if err = client.Ping(ctx, nil); err != nil {
		return err
	}

	Database = client.Database(extractDBName(uri))
	log.Println("Now connected to MongoDB Atlas.")
	return nil
}

// extractDBName pulls the database name from the URI or falls back to env/default.
func extractDBName(uri string) string {
	if name := os.Getenv("MONGO_DB_NAME"); name != "" {
		return name
	}
	// mongodb+srv://user:pass@host/dbname?options
	parts := strings.Split(uri, "/")
	if len(parts) >= 4 {
		part := parts[3]
		if idx := strings.Index(part, "?"); idx != -1 {
			part = part[:idx]
		}
		if part != "" {
			return part
		}
	}
	return "bc-pos"
}

func Disconnect() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.Disconnect(ctx); err != nil {
		log.Printf("Error disconnecting from MongoDB: %v", err)
	}
}

func GetCollection(name string) *mongo.Collection {
	return Database.Collection(name)
}
