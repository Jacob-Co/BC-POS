package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"bc-pos-backend/internal/db"
	"bc-pos-backend/internal/handlers"
	"bc-pos-backend/internal/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	if os.Getenv("DB_DRIVER") != "postgres" {
		if err := db.Connect(); err != nil {
			log.Fatalf("Failed to connect to MongoDB: %v", err)
		}
		defer db.Disconnect()
	}

	r := gin.Default()
	r.Use(corsMiddleware())

	api := r.Group("/api")

	// ── Users ──────────────────────────────────────────────────────────────
	users := api.Group("/users")
	{
		users.POST("/", handlers.RegisterUser)
		users.POST("/login", handlers.LoginUser)
		users.POST("/google-login", handlers.GoogleLogin)
		users.GET("/details", middleware.Auth(), handlers.GetUserDetails)
		users.PATCH("/password", middleware.Auth(), handlers.EditPassword)
		users.DELETE("/", middleware.Auth(), handlers.DeleteUser)

		// Admin-only: list all registered users
		users.GET("/all", middleware.AdminAuth(), handlers.GetAllUsers)
	}

	// ── Items (all routes require authentication) ──────────────────────────
	items := api.Group("/items")
	items.Use(middleware.Auth())
	{
		items.POST("/", handlers.CreateItem)
		items.POST("/no-barcode", handlers.CreateItemWithoutBarcode)
		items.GET("/all", handlers.GetAllItems)
		items.GET("/invalid-barcodes", handlers.GetInvalidBarcodes)
		items.GET("/csv-inventory", handlers.GetInventoryCSV)
		items.PATCH("/:itemId", handlers.EditItem)
		items.DELETE("/:itemId", handlers.DeleteItem)
	}

	// ── Receipts (all routes require authentication) ───────────────────────
	receipts := api.Group("/receipts")
	receipts.Use(middleware.Auth())
	{
		receipts.POST("/", handlers.RecordReceipt)
		receipts.POST("/hardCode", handlers.HardCodeReceipt)
		receipts.POST("/multiple", handlers.RecordReceipts)
		receipts.GET("/dates/:startUNIX/:endUNIX", handlers.GetReceiptsByDate)
		receipts.GET("/sales/:UNIX", handlers.GetSales)
		receipts.GET("/unresolved", handlers.GetUnresolved)
		receipts.PATCH("/:receiptId", handlers.EditReceipt)
		receipts.DELETE("/:receiptId", handlers.DeleteReceipt)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("API is now online on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}
		c.Next()
	}
}
