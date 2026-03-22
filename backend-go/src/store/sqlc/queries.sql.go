package sqlc

import (
	"context"
	"database/sql"
	"errors"
)

func (q *Queries) CreateUser(ctx context.Context, arg User) error {
	_, err := q.db.ExecContext(ctx, `INSERT INTO users (id, first_name, last_name, password, email, is_admin, login_type, last_used_token, item_password, receipt_password)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, arg.ID, arg.FirstName, arg.LastName, arg.Password, arg.Email, arg.IsAdmin, arg.LoginType, arg.LastUsedToken, arg.ItemPassword, arg.ReceiptPassword)
	return err
}

func (q *Queries) GetUserByID(ctx context.Context, id string) (User, error) {
	row := q.db.QueryRowContext(ctx, `SELECT id, first_name, last_name, password, email, is_admin, login_type, last_used_token, item_password, receipt_password FROM users WHERE id = $1`, id)
	var u User
	err := row.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Password, &u.Email, &u.IsAdmin, &u.LoginType, &u.LastUsedToken, &u.ItemPassword, &u.ReceiptPassword)
	return u, err
}

func (q *Queries) GetUserByEmail(ctx context.Context, email string) (User, error) {
	row := q.db.QueryRowContext(ctx, `SELECT id, first_name, last_name, password, email, is_admin, login_type, last_used_token, item_password, receipt_password FROM users WHERE email = $1`, email)
	var u User
	err := row.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Password, &u.Email, &u.IsAdmin, &u.LoginType, &u.LastUsedToken, &u.ItemPassword, &u.ReceiptPassword)
	return u, err
}

func (q *Queries) SetUserLastUsedToken(ctx context.Context, userID, token string) error {
	_, err := q.db.ExecContext(ctx, `UPDATE users SET last_used_token = $2 WHERE id = $1`, userID, token)
	return err
}

func (q *Queries) SetUserPassword(ctx context.Context, userID, field, hashed string) error {
	_, err := q.db.ExecContext(ctx, `UPDATE users SET password = CASE WHEN $2='password' THEN $3 ELSE password END,
                 item_password = CASE WHEN $2='itemPassword' THEN $3 ELSE item_password END,
                 receipt_password = CASE WHEN $2='receiptPassword' THEN $3 ELSE receipt_password END
WHERE id = $1`, userID, field, hashed)
	return err
}

func (q *Queries) DeleteUserByID(ctx context.Context, id string) error {
	_, err := q.db.ExecContext(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

func (q *Queries) ListUsersWithoutSecrets(ctx context.Context) ([]UserPublic, error) {
	rows, err := q.db.QueryContext(ctx, `SELECT id, first_name, last_name, email, is_admin, login_type FROM users`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []UserPublic
	for rows.Next() {
		var u UserPublic
		if err := rows.Scan(&u.ID, &u.FirstName, &u.LastName, &u.Email, &u.IsAdmin, &u.LoginType); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (q *Queries) CreateItem(ctx context.Context, arg Item) error {
	_, err := q.db.ExecContext(ctx, `INSERT INTO items (id, user_id, name, barcode, is_valid_barcode, is_barcode_checked, price, stock, off_price, expiry_dates)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, arg.ID, arg.UserID, arg.Name, arg.Barcode, arg.IsValidBarcode, arg.IsBarcodeChecked, arg.Price, arg.Stock, arg.OffPrice, pqInt64Array(arg.ExpiryDates))
	return err
}

func (q *Queries) ItemExistsByName(ctx context.Context, userID, name string) (bool, error) {
	var exists bool
	err := q.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM items WHERE user_id = $1 AND name = $2)`, userID, name).Scan(&exists)
	return exists, err
}

func (q *Queries) ItemExistsByBarcode(ctx context.Context, userID, barcode string) (bool, error) {
	var exists bool
	err := q.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM items WHERE user_id = $1 AND barcode = $2)`, userID, barcode).Scan(&exists)
	return exists, err
}

func (q *Queries) ListItemsByUser(ctx context.Context, userID string) ([]Item, error) {
	rows, err := q.db.QueryContext(ctx, `SELECT id, user_id, name, barcode, is_valid_barcode, is_barcode_checked, price, stock, off_price, expiry_dates FROM items WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Item
	for rows.Next() {
		var i Item
		var expiry pqInt64Array
		if err := rows.Scan(&i.ID, &i.UserID, &i.Name, &i.Barcode, &i.IsValidBarcode, &i.IsBarcodeChecked, &i.Price, &i.Stock, &i.OffPrice, &expiry); err != nil {
			return nil, err
		}
		i.ExpiryDates = []int64(expiry)
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) ListInvalidBarcodeCandidates(ctx context.Context, userID string) ([]Item, error) {
	rows, err := q.db.QueryContext(ctx, `SELECT id, user_id, name, barcode, is_valid_barcode, is_barcode_checked, price, stock, off_price, expiry_dates FROM items WHERE user_id = $1 AND barcode <> '' AND is_valid_barcode = false`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Item
	for rows.Next() {
		var i Item
		var expiry pqInt64Array
		if err := rows.Scan(&i.ID, &i.UserID, &i.Name, &i.Barcode, &i.IsValidBarcode, &i.IsBarcodeChecked, &i.Price, &i.Stock, &i.OffPrice, &expiry); err != nil {
			return nil, err
		}
		i.ExpiryDates = []int64(expiry)
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) DeleteItemByIDAndUser(ctx context.Context, itemID, userID string) error {
	_, err := q.db.ExecContext(ctx, `DELETE FROM items WHERE id = $1 AND user_id = $2`, itemID, userID)
	return err
}

func (q *Queries) IncrementItemStock(ctx context.Context, itemID, userID string, delta float64) error {
	_, err := q.db.ExecContext(ctx, `UPDATE items SET stock = stock + $3 WHERE id = $1 AND user_id = $2`, itemID, userID, delta)
	return err
}

func (q *Queries) ListItemsByIDs(ctx context.Context, ids []string) ([]Item, error) {
	rows, err := q.db.QueryContext(ctx, `SELECT id, user_id, name, barcode, is_valid_barcode, is_barcode_checked, price, stock, off_price, expiry_dates FROM items WHERE id = ANY($1::text[])`, pqStringArray(ids))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Item
	for rows.Next() {
		var i Item
		var expiry pqInt64Array
		if err := rows.Scan(&i.ID, &i.UserID, &i.Name, &i.Barcode, &i.IsValidBarcode, &i.IsBarcodeChecked, &i.Price, &i.Stock, &i.OffPrice, &expiry); err != nil {
			return nil, err
		}
		i.ExpiryDates = []int64(expiry)
		out = append(out, i)
	}
	return out, rows.Err()
}

func (q *Queries) CreateReceipt(ctx context.Context, arg Receipt) error {
	_, err := q.db.ExecContext(ctx, `INSERT INTO receipts (id, user_id, total_price, date_ms, comment, action_taken, is_resolved, transaction_mode, send_code)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, arg.ID, arg.UserID, arg.TotalPrice, arg.DateMS, arg.Comment, arg.ActionTaken, arg.IsResolved, arg.TransactionMode, arg.SendCode)
	return err
}

func (q *Queries) CreateReceiptItem(ctx context.Context, arg ReceiptItem) error {
	_, err := q.db.ExecContext(ctx, `INSERT INTO receipt_items (receipt_id, item_id, quantity, off_price) VALUES ($1,$2,$3,$4)`, arg.ReceiptID, arg.ItemID, arg.Quantity, arg.OffPrice)
	return err
}

func (q *Queries) ReceiptExistsBySendCode(ctx context.Context, sendCode string) (bool, error) {
	var exists bool
	err := q.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM receipts WHERE send_code = $1)`, sendCode).Scan(&exists)
	return exists, err
}

func (q *Queries) GetReceiptStockLines(ctx context.Context, receiptID string) ([]ReceiptStockLine, error) {
	rows, err := q.db.QueryContext(ctx, `SELECT item_id, quantity FROM receipt_items WHERE receipt_id = $1`, receiptID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ReceiptStockLine
	for rows.Next() {
		var r ReceiptStockLine
		if err := rows.Scan(&r.ItemID, &r.Quantity); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) ReceiptBelongsToUser(ctx context.Context, receiptID, userID string) (bool, error) {
	var exists bool
	err := q.db.QueryRowContext(ctx, `SELECT EXISTS(SELECT 1 FROM receipts WHERE id = $1 AND user_id = $2)`, receiptID, userID).Scan(&exists)
	return exists, err
}

func (q *Queries) DeleteReceiptByIDAndUser(ctx context.Context, receiptID, userID string) error {
	_, err := q.db.ExecContext(ctx, `DELETE FROM receipts WHERE id = $1 AND user_id = $2`, receiptID, userID)
	return err
}

func (q *Queries) listReceipts(ctx context.Context, query string, args ...interface{}) ([]Receipt, error) {
	rows, err := q.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Receipt
	for rows.Next() {
		var r Receipt
		if err := rows.Scan(&r.ID, &r.UserID, &r.TotalPrice, &r.DateMS, &r.Comment, &r.ActionTaken, &r.IsResolved, &r.TransactionMode, &r.SendCode); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (q *Queries) ListReceiptsByDateRange(ctx context.Context, userID string, start, end int64) ([]Receipt, error) {
	return q.listReceipts(ctx, `SELECT id, user_id, total_price, date_ms, comment, action_taken, is_resolved, transaction_mode, send_code FROM receipts WHERE user_id = $1 AND date_ms >= $2 AND date_ms <= $3`, userID, start, end)
}

func (q *Queries) ListReceiptsByDay(ctx context.Context, userID string, dayStart, dayEnd int64) ([]Receipt, error) {
	return q.listReceipts(ctx, `SELECT id, user_id, total_price, date_ms, comment, action_taken, is_resolved, transaction_mode, send_code FROM receipts WHERE user_id = $1 AND date_ms >= $2 AND date_ms < $3`, userID, dayStart, dayEnd)
}

func (q *Queries) ListUnresolvedReceipts(ctx context.Context, userID string) ([]Receipt, error) {
	return q.listReceipts(ctx, `SELECT id, user_id, total_price, date_ms, comment, action_taken, is_resolved, transaction_mode, send_code FROM receipts WHERE user_id = $1 AND is_resolved = false`, userID)
}

func (q *Queries) ListReceiptItemsByReceiptIDs(ctx context.Context, ids []string) ([]ReceiptItem, error) {
	rows, err := q.db.QueryContext(ctx, `SELECT receipt_id, item_id, quantity, off_price FROM receipt_items WHERE receipt_id = ANY($1::text[])`, pqStringArray(ids))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []ReceiptItem
	for rows.Next() {
		var ri ReceiptItem
		if err := rows.Scan(&ri.ReceiptID, &ri.ItemID, &ri.Quantity, &ri.OffPrice); err != nil {
			return nil, err
		}
		out = append(out, ri)
	}
	return out, rows.Err()
}

func isNoRows(err error) bool { return errors.Is(err, sql.ErrNoRows) }
