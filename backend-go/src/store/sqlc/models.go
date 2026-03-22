package sqlc

type User struct {
	ID              string
	FirstName       string
	LastName        string
	Password        string
	Email           string
	IsAdmin         bool
	LoginType       string
	LastUsedToken   string
	ItemPassword    string
	ReceiptPassword string
}

type UserPublic struct {
	ID        string
	FirstName string
	LastName  string
	Email     string
	IsAdmin   bool
	LoginType string
}

type Item struct {
	ID               string
	UserID           string
	Name             string
	Barcode          string
	IsValidBarcode   bool
	IsBarcodeChecked bool
	Price            float64
	Stock            float64
	OffPrice         float64
	ExpiryDates      []int64
}

type Receipt struct {
	ID              string
	UserID          string
	TotalPrice      float64
	DateMS          int64
	Comment         string
	ActionTaken     string
	IsResolved      bool
	TransactionMode string
	SendCode        string
}

type ReceiptItem struct {
	ReceiptID string
	ItemID    string
	Quantity  float64
	OffPrice  float64
}

type ReceiptStockLine struct {
	ItemID   string
	Quantity float64
}
