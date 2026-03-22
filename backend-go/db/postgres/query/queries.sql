-- name: CreateUser :exec
INSERT INTO users (id, first_name, last_name, password, email, is_admin, login_type, last_used_token, item_password, receipt_password)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10);

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: SetUserLastUsedToken :exec
UPDATE users SET last_used_token = $2 WHERE id = $1;

-- name: SetUserPassword :exec
UPDATE users SET password = CASE WHEN $2='password' THEN $3 ELSE password END,
                 item_password = CASE WHEN $2='itemPassword' THEN $3 ELSE item_password END,
                 receipt_password = CASE WHEN $2='receiptPassword' THEN $3 ELSE receipt_password END
WHERE id = $1;

-- name: DeleteUserByID :exec
DELETE FROM users WHERE id = $1;

-- name: ListUsersWithoutSecrets :many
SELECT id, first_name, last_name, email, is_admin, login_type FROM users;

-- name: CreateItem :exec
INSERT INTO items (id, user_id, name, barcode, is_valid_barcode, is_barcode_checked, price, stock, off_price, expiry_dates)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10);

-- name: ItemExistsByName :one
SELECT EXISTS(SELECT 1 FROM items WHERE user_id = $1 AND name = $2);

-- name: ItemExistsByBarcode :one
SELECT EXISTS(SELECT 1 FROM items WHERE user_id = $1 AND barcode = $2);

-- name: ListItemsByUser :many
SELECT * FROM items WHERE user_id = $1;

-- name: ListInvalidBarcodeCandidates :many
SELECT * FROM items WHERE user_id = $1 AND barcode <> '' AND is_valid_barcode = false;

-- name: DeleteItemByIDAndUser :exec
DELETE FROM items WHERE id = $1 AND user_id = $2;

-- name: IncrementItemStock :exec
UPDATE items SET stock = stock + $3 WHERE id = $1 AND user_id = $2;

-- name: ListItemsByIDs :many
SELECT * FROM items WHERE id = ANY($1::text[]);

-- name: CreateReceipt :exec
INSERT INTO receipts (id, user_id, total_price, date_ms, comment, action_taken, is_resolved, transaction_mode, send_code)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);

-- name: CreateReceiptItem :exec
INSERT INTO receipt_items (receipt_id, item_id, quantity, off_price)
VALUES ($1,$2,$3,$4);

-- name: ReceiptExistsBySendCode :one
SELECT EXISTS(SELECT 1 FROM receipts WHERE send_code = $1);

-- name: GetReceiptStockLines :many
SELECT item_id, quantity FROM receipt_items WHERE receipt_id = $1;

-- name: ReceiptBelongsToUser :one
SELECT EXISTS(SELECT 1 FROM receipts WHERE id = $1 AND user_id = $2);

-- name: DeleteReceiptByIDAndUser :exec
DELETE FROM receipts WHERE id = $1 AND user_id = $2;

-- name: ListReceiptsByDateRange :many
SELECT * FROM receipts WHERE user_id = $1 AND date_ms >= $2 AND date_ms <= $3;

-- name: ListReceiptsByDay :many
SELECT * FROM receipts WHERE user_id = $1 AND date_ms >= $2 AND date_ms < $3;

-- name: ListUnresolvedReceipts :many
SELECT * FROM receipts WHERE user_id = $1 AND is_resolved = false;

-- name: ListReceiptItemsByReceiptIDs :many
SELECT receipt_id, item_id, quantity, off_price FROM receipt_items WHERE receipt_id = ANY($1::text[]);
