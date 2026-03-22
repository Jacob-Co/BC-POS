package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"bc-pos-backend/internal/models"
	sqlcdb "bc-pos-backend/internal/store/sqlc"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PostgresStore struct {
	db *sql.DB
	q  *sqlcdb.Queries
}

func NewPostgresStore(db *sql.DB) Store {
	return &PostgresStore{db: db, q: sqlcdb.New(db)}
}

func parseOrNewHex(id string) primitive.ObjectID {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return primitive.NewObjectID()
	}
	return oid
}

func toModelUser(u sqlcdb.User) models.User {
	return models.User{
		ID:              parseOrNewHex(u.ID),
		FirstName:       u.FirstName,
		LastName:        u.LastName,
		Password:        u.Password,
		Email:           u.Email,
		IsAdmin:         u.IsAdmin,
		LoginType:       u.LoginType,
		LastUsedToken:   u.LastUsedToken,
		ItemPassword:    u.ItemPassword,
		ReceiptPassword: u.ReceiptPassword,
	}
}

func toModelItem(i sqlcdb.Item) models.Item {
	return models.Item{
		ID:               parseOrNewHex(i.ID),
		Name:             i.Name,
		Barcode:          i.Barcode,
		IsValidBarcode:   i.IsValidBarcode,
		IsBarcodeChecked: i.IsBarcodeChecked,
		Price:            i.Price,
		Stock:            i.Stock,
		User:             parseOrNewHex(i.UserID),
		OffPrice:         i.OffPrice,
		ExpiryDates:      i.ExpiryDates,
	}
}

func toModelReceipt(r sqlcdb.Receipt, items []sqlcdb.ReceiptItem) models.Receipt {
	mr := models.Receipt{
		ID:              parseOrNewHex(r.ID),
		TotalPrice:      r.TotalPrice,
		Date:            r.DateMS,
		Comment:         r.Comment,
		ActionTaken:     r.ActionTaken,
		IsResolved:      r.IsResolved,
		TransactionMode: r.TransactionMode,
		User:            parseOrNewHex(r.UserID),
		SendCode:        r.SendCode,
		Items:           make([]models.ReceiptItem, 0, len(items)),
	}
	for _, it := range items {
		mr.Items = append(mr.Items, models.ReceiptItem{Item: parseOrNewHex(it.ItemID), Quantity: it.Quantity, OffPrice: it.OffPrice})
	}
	return mr
}

func (s *PostgresStore) withTimeout() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 5*time.Second)
}

func (s *PostgresStore) CreateUser(user models.User) error {
	id := user.ID.Hex()
	if user.ID.IsZero() {
		id = primitive.NewObjectID().Hex()
	}
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.CreateUser(ctx, sqlcdb.User{
		ID: id, FirstName: user.FirstName, LastName: user.LastName, Password: user.Password,
		Email: user.Email, IsAdmin: user.IsAdmin, LoginType: user.LoginType,
		LastUsedToken: user.LastUsedToken, ItemPassword: user.ItemPassword, ReceiptPassword: user.ReceiptPassword,
	})
}

func (s *PostgresStore) FindUserByID(id string) (*models.User, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	u, err := s.q.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	mu := toModelUser(u)
	return &mu, nil
}

func (s *PostgresStore) FindUserByEmail(email string) (*models.User, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	u, err := s.q.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	mu := toModelUser(u)
	return &mu, nil
}

func (s *PostgresStore) SetUserLastUsedToken(userID, token string) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.SetUserLastUsedToken(ctx, userID, token)
}

func (s *PostgresStore) SetUserPassword(userID, field, hashedPassword string) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.SetUserPassword(ctx, userID, field, hashedPassword)
}

func (s *PostgresStore) DeleteUserByID(userID string) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.DeleteUserByID(ctx, userID)
}

func (s *PostgresStore) ListUsersWithoutSecrets() ([]models.User, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	users, err := s.q.ListUsersWithoutSecrets(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]models.User, 0, len(users))
	for _, u := range users {
		out = append(out, models.User{ID: parseOrNewHex(u.ID), FirstName: u.FirstName, LastName: u.LastName, Email: u.Email, IsAdmin: u.IsAdmin, LoginType: u.LoginType})
	}
	return out, nil
}

func (s *PostgresStore) CreateItem(userID string, item models.Item) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	id := item.ID.Hex()
	if item.ID.IsZero() {
		id = primitive.NewObjectID().Hex()
	}
	return s.q.CreateItem(ctx, sqlcdb.Item{ID: id, UserID: userID, Name: item.Name, Barcode: item.Barcode, IsValidBarcode: item.IsValidBarcode, IsBarcodeChecked: item.IsBarcodeChecked, Price: item.Price, Stock: item.Stock, OffPrice: item.OffPrice, ExpiryDates: item.ExpiryDates})
}

func (s *PostgresStore) ItemExistsByName(userID, name string) (bool, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.ItemExistsByName(ctx, userID, name)
}

func (s *PostgresStore) ItemExistsByBarcode(userID, barcode string) (bool, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.ItemExistsByBarcode(ctx, userID, barcode)
}

func (s *PostgresStore) ListItemsByUser(userID string) ([]models.Item, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	items, err := s.q.ListItemsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]models.Item, 0, len(items))
	for _, i := range items {
		out = append(out, toModelItem(i))
	}
	return out, nil
}

func (s *PostgresStore) ListInvalidBarcodeCandidates(userID string) ([]models.Item, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	items, err := s.q.ListInvalidBarcodeCandidates(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]models.Item, 0, len(items))
	for _, i := range items {
		out = append(out, toModelItem(i))
	}
	return out, nil
}

func (s *PostgresStore) UpdateItemByIDAndUser(userID, itemID string, update map[string]interface{}) error {
	setCols := ""
	args := []interface{}{}
	idx := 1
	for _, col := range []string{"name", "barcode", "isValidBarcode", "isBarcodeChecked", "price", "stock", "offPrice", "expiryDates"} {
		if v, ok := update[col]; ok {
			dbCol := map[string]string{"isValidBarcode": "is_valid_barcode", "isBarcodeChecked": "is_barcode_checked", "offPrice": "off_price", "expiryDates": "expiry_dates"}[col]
			if dbCol == "" {
				dbCol = col
			}
			if setCols != "" {
				setCols += ", "
			}
			setCols += fmt.Sprintf("%s = $%d", dbCol, idx)
			args = append(args, v)
			idx++
		}
	}
	if setCols == "" {
		return nil
	}
	args = append(args, itemID, userID)
	ctx, cancel := s.withTimeout()
	defer cancel()
	_, err := s.db.ExecContext(ctx, fmt.Sprintf("UPDATE items SET %s WHERE id = $%d AND user_id = $%d", setCols, idx, idx+1), args...)
	return err
}

func (s *PostgresStore) DeleteItemByIDAndUser(userID, itemID string) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.DeleteItemByIDAndUser(ctx, itemID, userID)
}

func (s *PostgresStore) IncrementItemStock(userID, itemID string, delta float64) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.IncrementItemStock(ctx, itemID, userID, delta)
}

func (s *PostgresStore) ListItemsByHexIDs(ids []string) ([]models.Item, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	items, err := s.q.ListItemsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]models.Item, 0, len(items))
	for _, i := range items {
		out = append(out, toModelItem(i))
	}
	return out, nil
}

func (s *PostgresStore) CreateReceipt(userID string, input ReceiptInput) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	qtx := sqlcdb.New(tx)
	receiptID := primitive.NewObjectID().Hex()
	isResolved := true
	if input.IsResolved != nil {
		isResolved = *input.IsResolved
	}
	if err := qtx.CreateReceipt(ctx, sqlcdb.Receipt{ID: receiptID, UserID: userID, TotalPrice: input.TotalPrice, DateMS: input.Date, Comment: input.Comment, ActionTaken: input.ActionTaken, IsResolved: isResolved, TransactionMode: input.TransactionMode, SendCode: input.SendCode}); err != nil {
		tx.Rollback()
		return err
	}
	for _, ri := range input.Items {
		if err := qtx.CreateReceiptItem(ctx, sqlcdb.ReceiptItem{ReceiptID: receiptID, ItemID: ri.ItemID, Quantity: ri.Quantity, OffPrice: ri.OffPrice}); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (s *PostgresStore) ReceiptExistsBySendCode(sendCode string) (bool, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.ReceiptExistsBySendCode(ctx, sendCode)
}

func (s *PostgresStore) GetReceiptStockLines(receiptID, userID string) ([]ReceiptStockLine, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	ok, err := s.q.ReceiptBelongsToUser(ctx, receiptID, userID)
	if err != nil || !ok {
		return nil, err
	}
	lines, err := s.q.GetReceiptStockLines(ctx, receiptID)
	if err != nil {
		return nil, err
	}
	out := make([]ReceiptStockLine, 0, len(lines))
	for _, l := range lines {
		out = append(out, ReceiptStockLine{ItemID: l.ItemID, Quantity: l.Quantity})
	}
	return out, nil
}

func (s *PostgresStore) UpdateReceiptByIDAndUser(userID, receiptID string, update map[string]interface{}) error {
	setCols := ""
	args := []interface{}{}
	idx := 1
	for _, col := range []string{"totalPrice", "date", "comment", "actionTaken", "isResolved", "transactionMode", "sendCode"} {
		if v, ok := update[col]; ok {
			dbCol := map[string]string{"totalPrice": "total_price", "date": "date_ms", "actionTaken": "action_taken", "isResolved": "is_resolved", "transactionMode": "transaction_mode", "sendCode": "send_code"}[col]
			if dbCol == "" {
				dbCol = col
			}
			if setCols != "" {
				setCols += ", "
			}
			setCols += fmt.Sprintf("%s = $%d", dbCol, idx)
			args = append(args, v)
			idx++
		}
	}
	if setCols == "" {
		return nil
	}
	args = append(args, receiptID, userID)
	ctx, cancel := s.withTimeout()
	defer cancel()
	_, err := s.db.ExecContext(ctx, fmt.Sprintf("UPDATE receipts SET %s WHERE id = $%d AND user_id = $%d", setCols, idx, idx+1), args...)
	return err
}

func (s *PostgresStore) DeleteReceiptByIDAndUser(userID, receiptID string) error {
	ctx, cancel := s.withTimeout()
	defer cancel()
	return s.q.DeleteReceiptByIDAndUser(ctx, receiptID, userID)
}

func (s *PostgresStore) listAndHydrateReceipts(fetch func(context.Context) ([]sqlcdb.Receipt, error)) ([]models.Receipt, error) {
	ctx, cancel := s.withTimeout()
	defer cancel()
	rs, err := fetch(ctx)
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(rs))
	for _, r := range rs {
		ids = append(ids, r.ID)
	}
	itemsByReceipt := map[string][]sqlcdb.ReceiptItem{}
	if len(ids) > 0 {
		ris, err := s.q.ListReceiptItemsByReceiptIDs(ctx, ids)
		if err != nil {
			return nil, err
		}
		for _, ri := range ris {
			itemsByReceipt[ri.ReceiptID] = append(itemsByReceipt[ri.ReceiptID], ri)
		}
	}
	out := make([]models.Receipt, 0, len(rs))
	for _, r := range rs {
		out = append(out, toModelReceipt(r, itemsByReceipt[r.ID]))
	}
	return out, nil
}

func (s *PostgresStore) ListReceiptsByDateRange(userID string, start, end int64) ([]models.Receipt, error) {
	return s.listAndHydrateReceipts(func(ctx context.Context) ([]sqlcdb.Receipt, error) {
		return s.q.ListReceiptsByDateRange(ctx, userID, start, end)
	})
}

func (s *PostgresStore) ListReceiptsByDay(userID string, dayStart int64) ([]models.Receipt, error) {
	dayEnd := dayStart + 24*60*60*1000
	return s.listAndHydrateReceipts(func(ctx context.Context) ([]sqlcdb.Receipt, error) {
		return s.q.ListReceiptsByDay(ctx, userID, dayStart, dayEnd)
	})
}

func (s *PostgresStore) ListUnresolvedReceipts(userID string) ([]models.Receipt, error) {
	return s.listAndHydrateReceipts(func(ctx context.Context) ([]sqlcdb.Receipt, error) { return s.q.ListUnresolvedReceipts(ctx, userID) })
}
