package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"bc-pos-backend/internal/middleware"
	"bc-pos-backend/internal/models"
)

// POST /api/items  — create item with barcode (checks name + barcode uniqueness per user)
func CreateItem(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	userID := claims.ID

	var item models.Item
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if exists, _ := dataStore.ItemExistsByName(userID, item.Name); exists {
		c.JSON(200, gin.H{"result": false})
		return
	}
	if item.Barcode != "" {
		if exists, _ := dataStore.ItemExistsByBarcode(userID, item.Barcode); exists {
			c.JSON(200, gin.H{"result": false})
			return
		}
	}

	if item.ExpiryDates == nil {
		item.ExpiryDates = []int64{}
	}

	if err := dataStore.CreateItem(userID, item); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": item})
}

// POST /api/items/no-barcode  — create item without barcode (checks name uniqueness per user)
func CreateItemWithoutBarcode(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	userID := claims.ID

	var item models.Item
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if exists, _ := dataStore.ItemExistsByName(userID, item.Name); exists {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if item.ExpiryDates == nil {
		item.ExpiryDates = []int64{}
	}

	if err := dataStore.CreateItem(userID, item); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": item})
}

// GET /api/items/all  — return all items belonging to the authenticated user
func GetAllItems(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	items, err := dataStore.ListItemsByUser(claims.ID)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}
	c.JSON(200, gin.H{"result": items})
}

// PATCH /api/items/:itemId  — edit item; verifies itemPassword if one is set
func EditItem(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	userID := claims.ID
	itemID := c.Param("itemId")

	var body struct {
		Edits    map[string]interface{} `json:"edits"`
		Password string                 `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	user, err := dataStore.FindUserByID(userID)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if user.ItemPassword != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.ItemPassword), []byte(body.Password)); err != nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
	}

	if err := dataStore.UpdateItemByIDAndUser(userID, itemID, body.Edits); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

// DELETE /api/items/:itemId  — delete an item belonging to the authenticated user
func DeleteItem(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	if err := dataStore.DeleteItemByIDAndUser(claims.ID, c.Param("itemId")); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}
	c.JSON(200, gin.H{"result": true})
}

// GET /api/items/csv-inventory  — returns a CSV string of the user's inventory
func GetInventoryCSV(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	items, err := dataStore.ListItemsByUser(claims.ID)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	now := time.Now()
	dateString := fmt.Sprintf("%04d%02d%02d", now.Year(), now.Month(), now.Day())

	var sb strings.Builder
	sb.WriteString("Product Name,Stock,Price, Expiry Date\n")
	for _, item := range items {
		sb.WriteString(fmt.Sprintf("%s,%v,%v,%s\n", item.Name, item.Stock, item.Price, formatExpiryDate(item.ExpiryDates)))
	}

	c.JSON(200, gin.H{"result": gin.H{"csvString": sb.String(), "date": dateString}})
}

// GET /api/items/invalid-barcodes  — returns items with invalid or flagged barcodes.
func GetInvalidBarcodes(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	items, err := dataStore.ListInvalidBarcodeCandidates(claims.ID)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	const eanLen = 13
	const upcLen = 12

	invalid := make([]models.Item, 0)
	for _, item := range items {
		barcode := item.Barcode
		if len(barcode) > eanLen || len(barcode) < upcLen {
			invalid = append(invalid, item)
			continue
		}
		if !item.IsValidBarcode && item.IsBarcodeChecked {
			invalid = append(invalid, item)
		}
	}

	c.JSON(200, gin.H{"result": invalid})
}

// editItemStock increments/decrements an item's stock without a password check.
func editItemStock(userID, itemID string, delta float64) error {
	return dataStore.IncrementItemStock(userID, itemID, delta)
}

func formatExpiryDate(dates []int64) string {
	if len(dates) == 0 || dates[0] == 0 {
		return ""
	}
	t := time.Unix(dates[0]/1000, 0)
	return fmt.Sprintf("%d/%d/%d", t.Month(), t.Day(), t.Year())
}
