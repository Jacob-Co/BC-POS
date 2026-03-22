package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"bc-pos-backend/internal/middleware"
	"bc-pos-backend/internal/models"
	"bc-pos-backend/internal/store"
)

// receiptInput is the JSON shape accepted from clients.
type receiptItemInput struct {
	Item     string  `json:"item"`
	Quantity float64 `json:"quantity"`
	OffPrice float64 `json:"offPrice"`
}

type receiptInput struct {
	Items           []receiptItemInput `json:"items"`
	TotalPrice      float64            `json:"totalPrice"`
	Date            int64              `json:"date"`
	Comment         string             `json:"comment"`
	ActionTaken     string             `json:"actionTaken"`
	IsResolved      *bool              `json:"isResolved"`
	TransactionMode string             `json:"transactionMode"`
	SendCode        string             `json:"sendCode"`
}

func (ri receiptInput) toStoreInput() store.ReceiptInput {
	out := store.ReceiptInput{
		TotalPrice:      ri.TotalPrice,
		Date:            ri.Date,
		Comment:         ri.Comment,
		ActionTaken:     ri.ActionTaken,
		IsResolved:      ri.IsResolved,
		TransactionMode: ri.TransactionMode,
		SendCode:        ri.SendCode,
	}
	for _, item := range ri.Items {
		out.Items = append(out.Items, store.ReceiptItemInput{ItemID: item.Item, Quantity: item.Quantity, OffPrice: item.OffPrice})
	}
	if out.Items == nil {
		out.Items = []store.ReceiptItemInput{}
	}
	return out
}

func RecordReceipt(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	var input receiptInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if err := saveReceipt(claims.ID, input); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

func HardCodeReceipt(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	var body struct {
		Receipt  receiptInput `json:"receipt"`
		Password string       `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	user, err := dataStore.FindUserByID(claims.ID)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if user.ReceiptPassword != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.ReceiptPassword), []byte(body.Password)); err != nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
	}

	if err := saveReceipt(claims.ID, body.Receipt); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

func RecordReceipts(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	var inputs []receiptInput
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	for _, input := range inputs {
		_ = saveReceipt(claims.ID, input)
	}

	c.JSON(200, gin.H{"result": true})
}

func GetReceiptsByDate(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	startUNIX, err1 := strconv.ParseInt(c.Param("startUNIX"), 10, 64)
	endUNIX, err2 := strconv.ParseInt(c.Param("endUNIX"), 10, 64)
	if err1 != nil || err2 != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	receipts, err := populatedReceiptsByDateRange(claims.ID, startUNIX, endUNIX)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": receipts})
}

func GetSales(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)

	unix, err := strconv.ParseInt(c.Param("UNIX"), 10, 64)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	receipts, err := populatedReceiptsByDay(claims.ID, unix)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	itemPriceHash := map[string]float64{}
	itemCountHash := map[string]float64{}
	var total float64

	for _, receipt := range receipts {
		total += receipt.TotalPrice
		for _, ri := range receipt.Items {
			name := ri.Item.Name
			if _, ok := itemPriceHash[name]; !ok {
				itemPriceHash[name] = ri.Item.Price
			}
			itemCountHash[name] += ri.Quantity
		}
	}

	c.JSON(200, gin.H{"result": gin.H{"total": total, "itemPriceHash": itemPriceHash, "itemCountHash": itemCountHash}})
}

func GetUnresolved(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	receipts, err := populatedUnresolvedReceipts(claims.ID)
	if err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}
	c.JSON(200, gin.H{"result": receipts})
}

func EditReceipt(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	receiptID := c.Param("receiptId")

	var body struct {
		Edits    map[string]interface{} `json:"edits"`
		Password string                 `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	user, err := dataStore.FindUserByID(claims.ID)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if user.ReceiptPassword != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.ReceiptPassword), []byte(body.Password)); err != nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
	}

	if err := dataStore.UpdateReceiptByIDAndUser(claims.ID, receiptID, body.Edits); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

func DeleteReceipt(c *gin.Context) {
	claims := c.MustGet(middleware.ClaimsKey).(*middleware.Claims)
	receiptID := c.Param("receiptId")

	var body struct {
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	user, err := dataStore.FindUserByID(claims.ID)
	if err != nil || user == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	if user.ReceiptPassword != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.ReceiptPassword), []byte(body.Password)); err != nil {
			c.JSON(200, gin.H{"result": false})
			return
		}
	}

	stockLines, err := dataStore.GetReceiptStockLines(receiptID, claims.ID)
	if err != nil || stockLines == nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	for _, line := range stockLines {
		_ = editItemStock(claims.ID, line.ItemID, line.Quantity)
	}

	if err := dataStore.DeleteReceiptByIDAndUser(claims.ID, receiptID); err != nil {
		c.JSON(200, gin.H{"result": false})
		return
	}

	c.JSON(200, gin.H{"result": true})
}

func saveReceipt(userID string, input receiptInput) error {
	if input.SendCode != "" {
		exists, _ := dataStore.ReceiptExistsBySendCode(input.SendCode)
		if exists {
			return nil
		}
	}

	for _, ri := range input.Items {
		_ = editItemStock(userID, ri.Item, -ri.Quantity)
	}

	return dataStore.CreateReceipt(userID, input.toStoreInput())
}

func populatedReceiptsByDateRange(userID string, start, end int64) ([]models.PopulatedReceipt, error) {
	receipts, err := dataStore.ListReceiptsByDateRange(userID, start, end)
	if err != nil {
		return nil, err
	}
	return populateReceiptItems(receipts)
}

func populatedReceiptsByDay(userID string, dayStart int64) ([]models.PopulatedReceipt, error) {
	receipts, err := dataStore.ListReceiptsByDay(userID, dayStart)
	if err != nil {
		return nil, err
	}
	return populateReceiptItems(receipts)
}

func populatedUnresolvedReceipts(userID string) ([]models.PopulatedReceipt, error) {
	receipts, err := dataStore.ListUnresolvedReceipts(userID)
	if err != nil {
		return nil, err
	}
	return populateReceiptItems(receipts)
}

func populateReceiptItems(receipts []models.Receipt) ([]models.PopulatedReceipt, error) {
	idSet := map[string]struct{}{}
	for _, r := range receipts {
		for _, ri := range r.Items {
			idSet[ri.Item.Hex()] = struct{}{}
		}
	}

	itemMap := map[string]models.Item{}
	if len(idSet) > 0 {
		ids := make([]string, 0, len(idSet))
		for id := range idSet {
			ids = append(ids, id)
		}
		items, err := dataStore.ListItemsByHexIDs(ids)
		if err != nil {
			return nil, err
		}
		for _, item := range items {
			itemMap[item.ID.Hex()] = item
		}
	}

	populated := make([]models.PopulatedReceipt, 0, len(receipts))
	for _, r := range receipts {
		pr := models.PopulatedReceipt{
			ID:              r.ID,
			TotalPrice:      r.TotalPrice,
			Date:            r.Date,
			Comment:         r.Comment,
			ActionTaken:     r.ActionTaken,
			IsResolved:      r.IsResolved,
			TransactionMode: r.TransactionMode,
			User:            r.User,
			SendCode:        r.SendCode,
			Items:           make([]models.PopulatedReceiptItem, 0, len(r.Items)),
		}
		for _, ri := range r.Items {
			item := itemMap[ri.Item.Hex()]
			pr.Items = append(pr.Items, models.PopulatedReceiptItem{Item: item, Quantity: ri.Quantity, OffPrice: ri.OffPrice})
		}
		populated = append(populated, pr)
	}

	return populated, nil
}
