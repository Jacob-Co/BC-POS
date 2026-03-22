package handlers

import (
	"log"
	"os"

	"bc-pos-backend/internal/db"
	"bc-pos-backend/internal/store"
)

var dataStore = initStore()

func initStore() store.Store {
	if os.Getenv("DB_DRIVER") == "postgres" {
		pg, err := db.OpenPostgres()
		if err != nil {
			log.Fatalf("failed to open postgres: %v", err)
		}
		return store.NewPostgresStore(pg)
	}
	return store.NewMongoStore()
}
