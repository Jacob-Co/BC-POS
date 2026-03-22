package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"bc-pos-backend/internal/db"
	"bc-pos-backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ReceiptItemInput struct {
	ItemID   string
	Quantity float64
	OffPrice float64
}

type ReceiptInput struct {
	Items           []ReceiptItemInput
	TotalPrice      float64
	Date            int64
	Comment         string
	ActionTaken     string
	IsResolved      *bool
	TransactionMode string
	SendCode        string
}

type ReceiptStockLine struct {
	ItemID   string
	Quantity float64
}

type Store interface {
	CreateUser(user models.User) error
	FindUserByID(id string) (*models.User, error)
	FindUserByEmail(email string) (*models.User, error)
	SetUserLastUsedToken(userID, token string) error
	SetUserPassword(userID, field, hashedPassword string) error
	DeleteUserByID(userID string) error
	ListUsersWithoutSecrets() ([]models.User, error)

	CreateItem(userID string, item models.Item) error
	ItemExistsByName(userID, name string) (bool, error)
	ItemExistsByBarcode(userID, barcode string) (bool, error)
	ListItemsByUser(userID string) ([]models.Item, error)
	ListInvalidBarcodeCandidates(userID string) ([]models.Item, error)
	UpdateItemByIDAndUser(userID, itemID string, update map[string]interface{}) error
	DeleteItemByIDAndUser(userID, itemID string) error
	IncrementItemStock(userID, itemID string, delta float64) error
	ListItemsByHexIDs(ids []string) ([]models.Item, error)

	CreateReceipt(userID string, input ReceiptInput) error
	ReceiptExistsBySendCode(sendCode string) (bool, error)
	GetReceiptStockLines(receiptID, userID string) ([]ReceiptStockLine, error)
	UpdateReceiptByIDAndUser(userID, receiptID string, update map[string]interface{}) error
	DeleteReceiptByIDAndUser(userID, receiptID string) error
	ListReceiptsByDateRange(userID string, start, end int64) ([]models.Receipt, error)
	ListReceiptsByDay(userID string, dayStart int64) ([]models.Receipt, error)
	ListUnresolvedReceipts(userID string) ([]models.Receipt, error)
}

type MongoStore struct{}

func NewMongoStore() Store { return &MongoStore{} }

func (s *MongoStore) col(name string) *mongo.Collection { return db.GetCollection(name) }

func withTimeout(d time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), d)
}

func parseObjectID(id string) (primitive.ObjectID, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("invalid object id: %w", err)
	}
	return oid, nil
}

func (s *MongoStore) CreateUser(user models.User) error {
	if user.ID.IsZero() {
		user.ID = primitive.NewObjectID()
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err := s.col("users").InsertOne(ctx, user)
	return err
}

func (s *MongoStore) FindUserByID(id string) (*models.User, error) {
	oid, err := parseObjectID(id)
	if err != nil {
		return nil, err
	}
	return s.findUser(bson.M{"_id": oid})
}

func (s *MongoStore) FindUserByEmail(email string) (*models.User, error) {
	return s.findUser(bson.M{"email": email})
}

func (s *MongoStore) findUser(filter bson.M) (*models.User, error) {
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	var user models.User
	err := s.col("users").FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (s *MongoStore) SetUserLastUsedToken(userID, token string) error {
	oid, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("users").UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": bson.M{"lastUsedToken": token}})
	return err
}

func (s *MongoStore) SetUserPassword(userID, field, hashedPassword string) error {
	oid, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("users").UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": bson.M{field: hashedPassword}})
	return err
}

func (s *MongoStore) DeleteUserByID(userID string) error {
	oid, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("users").DeleteOne(ctx, bson.M{"_id": oid})
	return err
}

func (s *MongoStore) ListUsersWithoutSecrets() ([]models.User, error) {
	ctx, cancel := withTimeout(10 * time.Second)
	defer cancel()
	proj := options.Find().SetProjection(bson.M{"password": 0, "itemPassword": 0, "receiptPassword": 0, "lastUsedToken": 0})
	cur, err := s.col("users").Find(ctx, bson.M{}, proj)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var users []models.User
	if err := cur.All(ctx, &users); err != nil {
		return nil, err
	}
	if users == nil {
		users = []models.User{}
	}
	return users, nil
}

func (s *MongoStore) CreateItem(userID string, item models.Item) error {
	oid, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	item.User = oid
	if item.ID.IsZero() {
		item.ID = primitive.NewObjectID()
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("items").InsertOne(ctx, item)
	return err
}

func (s *MongoStore) itemExists(filter bson.M) (bool, error) {
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	var item models.Item
	err := s.col("items").FindOne(ctx, filter).Decode(&item)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *MongoStore) ItemExistsByName(userID, name string) (bool, error) {
	oid, err := parseObjectID(userID)
	if err != nil {
		return false, err
	}
	return s.itemExists(bson.M{"user": oid, "name": name})
}

func (s *MongoStore) ItemExistsByBarcode(userID, barcode string) (bool, error) {
	oid, err := parseObjectID(userID)
	if err != nil {
		return false, err
	}
	return s.itemExists(bson.M{"user": oid, "barcode": barcode})
}

func (s *MongoStore) ListItemsByUser(userID string) ([]models.Item, error) {
	oid, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}
	return s.listItems(bson.M{"user": oid})
}

func (s *MongoStore) ListInvalidBarcodeCandidates(userID string) ([]models.Item, error) {
	oid, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}
	return s.listItems(bson.M{"user": oid, "barcode": bson.M{"$nin": bson.A{nil, ""}}, "isValidBarcode": bson.M{"$ne": true}})
}

func (s *MongoStore) listItems(filter bson.M) ([]models.Item, error) {
	ctx, cancel := withTimeout(10 * time.Second)
	defer cancel()
	cur, err := s.col("items").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var items []models.Item
	if err := cur.All(ctx, &items); err != nil {
		return nil, err
	}
	if items == nil {
		items = []models.Item{}
	}
	return items, nil
}

func (s *MongoStore) UpdateItemByIDAndUser(userID, itemID string, update map[string]interface{}) error {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	itemOID, err := parseObjectID(itemID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("items").UpdateOne(ctx, bson.M{"user": userOID, "_id": itemOID}, update)
	return err
}

func (s *MongoStore) DeleteItemByIDAndUser(userID, itemID string) error {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	itemOID, err := parseObjectID(itemID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("items").DeleteOne(ctx, bson.M{"user": userOID, "_id": itemOID})
	return err
}

func (s *MongoStore) IncrementItemStock(userID, itemID string, delta float64) error {
	return s.UpdateItemByIDAndUser(userID, itemID, map[string]interface{}{"$inc": map[string]interface{}{"stock": delta}})
}

func (s *MongoStore) ListItemsByHexIDs(ids []string) ([]models.Item, error) {
	oids := make([]primitive.ObjectID, 0, len(ids))
	for _, id := range ids {
		oid, err := parseObjectID(id)
		if err != nil {
			continue
		}
		oids = append(oids, oid)
	}
	if len(oids) == 0 {
		return []models.Item{}, nil
	}
	return s.listItems(bson.M{"_id": bson.M{"$in": oids}})
}

func (s *MongoStore) CreateReceipt(userID string, input ReceiptInput) error {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	receipt := models.Receipt{
		ID:              primitive.NewObjectID(),
		TotalPrice:      input.TotalPrice,
		Date:            input.Date,
		Comment:         input.Comment,
		ActionTaken:     input.ActionTaken,
		IsResolved:      true,
		TransactionMode: input.TransactionMode,
		SendCode:        input.SendCode,
		User:            userOID,
	}
	if input.IsResolved != nil {
		receipt.IsResolved = *input.IsResolved
	}
	for _, item := range input.Items {
		itemOID, err := parseObjectID(item.ItemID)
		if err != nil {
			continue
		}
		receipt.Items = append(receipt.Items, models.ReceiptItem{Item: itemOID, Quantity: item.Quantity, OffPrice: item.OffPrice})
	}
	if receipt.Items == nil {
		receipt.Items = []models.ReceiptItem{}
	}

	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("receipts").InsertOne(ctx, receipt)
	return err
}

func (s *MongoStore) ReceiptExistsBySendCode(sendCode string) (bool, error) {
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	var receipt models.Receipt
	err := s.col("receipts").FindOne(ctx, bson.M{"sendCode": sendCode}).Decode(&receipt)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (s *MongoStore) GetReceiptStockLines(receiptID, userID string) ([]ReceiptStockLine, error) {
	receiptOID, err := parseObjectID(receiptID)
	if err != nil {
		return nil, err
	}
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	var receipt models.Receipt
	err = s.col("receipts").FindOne(ctx, bson.M{"_id": receiptOID, "user": userOID}).Decode(&receipt)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	lines := make([]ReceiptStockLine, 0, len(receipt.Items))
	for _, item := range receipt.Items {
		lines = append(lines, ReceiptStockLine{ItemID: item.Item.Hex(), Quantity: item.Quantity})
	}
	return lines, nil
}

func (s *MongoStore) UpdateReceiptByIDAndUser(userID, receiptID string, update map[string]interface{}) error {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	receiptOID, err := parseObjectID(receiptID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("receipts").UpdateOne(ctx, bson.M{"user": userOID, "_id": receiptOID}, update)
	return err
}

func (s *MongoStore) DeleteReceiptByIDAndUser(userID, receiptID string) error {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return err
	}
	receiptOID, err := parseObjectID(receiptID)
	if err != nil {
		return err
	}
	ctx, cancel := withTimeout(5 * time.Second)
	defer cancel()
	_, err = s.col("receipts").DeleteOne(ctx, bson.M{"_id": receiptOID, "user": userOID})
	return err
}

func (s *MongoStore) ListReceiptsByDateRange(userID string, start, end int64) ([]models.Receipt, error) {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}
	return s.listReceipts(bson.M{"date": bson.M{"$gte": start, "$lte": end}, "user": userOID})
}

func (s *MongoStore) ListReceiptsByDay(userID string, dayStart int64) ([]models.Receipt, error) {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}
	return s.listReceipts(bson.M{"date": bson.M{"$gte": dayStart, "$lt": dayStart + 24*60*60*1000}, "user": userOID})
}

func (s *MongoStore) ListUnresolvedReceipts(userID string) ([]models.Receipt, error) {
	userOID, err := parseObjectID(userID)
	if err != nil {
		return nil, err
	}
	return s.listReceipts(bson.M{"user": userOID, "isResolved": false})
}

func (s *MongoStore) listReceipts(filter bson.M) ([]models.Receipt, error) {
	ctx, cancel := withTimeout(10 * time.Second)
	defer cancel()
	cur, err := s.col("receipts").Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)
	var receipts []models.Receipt
	if err := cur.All(ctx, &receipts); err != nil {
		return nil, err
	}
	if receipts == nil {
		receipts = []models.Receipt{}
	}
	return receipts, nil
}
