package e2e

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

const (
	composeFile = "docker-compose.postgres.yml"
	pgUser      = "bc_pos_user"
	pgDB        = "bc_pos"
	pgDSN       = "postgres://bc_pos_user:bc_pos_password@localhost:5432/bc_pos?sslmode=disable"
)

func TestE2E_PostgresFlow(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := waitForPort("127.0.0.1:5432", 2*time.Second); err != nil {
		if _, lookErr := exec.LookPath("docker"); lookErr != nil {
			t.Skip("postgres not running and docker unavailable in PATH")
		}
	}

	if err := ensurePostgresRunning(ctx); err != nil {
		t.Fatalf("postgres not available: %v", err)
	}

	if err := applySchema(ctx); err != nil {
		t.Fatalf("apply schema: %v", err)
	}

	port := "38081"
	serverCmd := exec.CommandContext(ctx, "go", "run", "main.go")
	serverCmd.Dir = filepath.Clean("..")
	serverCmd.Env = append(os.Environ(),
		"GO_ENV=test",
		"DB_DRIVER=postgres",
		"POSTGRES_DSN="+pgDSN,
		"SECRET=e2e-secret",
		"PORT="+port,
	)
	serverCmd.Stdout = os.Stdout
	serverCmd.Stderr = os.Stderr

	if err := serverCmd.Start(); err != nil {
		t.Fatalf("start server: %v", err)
	}
	defer func() {
		_ = serverCmd.Process.Kill()
		_ = serverCmd.Wait()
	}()

	if err := waitForPort("127.0.0.1:"+port, 30*time.Second); err != nil {
		t.Fatalf("server not reachable: %v", err)
	}

	baseURL := "http://127.0.0.1:" + port
	email := fmt.Sprintf("e2e_%d@example.com", time.Now().UnixNano())

	regRes := postJSON(t, baseURL+"/api/users/", "", map[string]any{
		"firstName": "E2E",
		"lastName":  "User",
		"email":     email,
		"password":  "password123",
		"loginType": "email",
	})
	if ok, _ := regRes["result"].(bool); !ok {
		t.Fatalf("register failed: %#v", regRes)
	}

	loginRes := postJSON(t, baseURL+"/api/users/login", "", map[string]any{
		"email":    email,
		"password": "password123",
	})
	token, ok := loginRes["result"].(string)
	if !ok || token == "" {
		t.Fatalf("login token missing: %#v", loginRes)
	}

	detailsRes := getJSON(t, baseURL+"/api/users/details", token)
	details, ok := detailsRes["result"].(map[string]any)
	if !ok {
		t.Fatalf("details result invalid: %#v", detailsRes)
	}
	if details["email"] != email {
		t.Fatalf("details email mismatch: got=%v want=%s", details["email"], email)
	}

	itemRes := postJSON(t, baseURL+"/api/items/", token, map[string]any{
		"name":             "E2E Item",
		"barcode":          "123456789012",
		"isValidBarcode":   false,
		"isBarcodeChecked": false,
		"price":            9.99,
		"stock":            10,
		"offPrice":         0,
		"expiryDates":      []int64{},
	})
	itemObj, ok := itemRes["result"].(map[string]any)
	if !ok {
		t.Fatalf("item create invalid: %#v", itemRes)
	}
	itemID, _ := itemObj["_id"].(string)
	if itemID == "" {
		t.Fatalf("item id missing: %#v", itemObj)
	}

	allItemsRes := getJSON(t, baseURL+"/api/items/all", token)
	items, ok := allItemsRes["result"].([]any)
	if !ok || len(items) == 0 {
		t.Fatalf("items list empty/invalid: %#v", allItemsRes)
	}

	receiptRes := postJSON(t, baseURL+"/api/receipts/", token, map[string]any{
		"items": []map[string]any{{
			"item":     itemID,
			"quantity": 2,
			"offPrice": 0,
		}},
		"totalPrice":      19.98,
		"date":            time.Now().UnixMilli(),
		"comment":         "e2e",
		"actionTaken":     "",
		"transactionMode": "cash",
		"sendCode":        fmt.Sprintf("send-%d", time.Now().UnixNano()),
	})
	if ok, _ := receiptRes["result"].(bool); !ok {
		t.Fatalf("receipt create failed: %#v", receiptRes)
	}
}

func ensurePostgresRunning(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composeFile, "up", "-d")
	cmd.Dir = filepath.Clean("..")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to start docker compose postgres: %w", err)
	}

	if err := waitForPort("127.0.0.1:5432", 45*time.Second); err != nil {
		return errors.New("postgres did not become healthy in time")
	}

	if err := waitForPostgresReady(ctx, 45*time.Second); err != nil {
		return err
	}

	return nil
}

func applySchema(ctx context.Context) error {
	schemaPath := filepath.Clean(filepath.Join("..", "db", "postgres", "schema.sql"))
	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composeFile, "exec", "-T", "postgres", "psql", "-U", pgUser, "-d", pgDB, "-f", "-")
	cmd.Dir = filepath.Clean("..")
	file, err := os.Open(schemaPath)
	if err != nil {
		return err
	}
	defer file.Close()
	cmd.Stdin = file
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("apply schema with docker exec psql: %w", err)
	}
	return nil
}

func waitForPostgresReady(ctx context.Context, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composeFile, "exec", "-T", "postgres", "pg_isready", "-U", pgUser, "-d", pgDB)
		cmd.Dir = filepath.Clean("..")
		if err := cmd.Run(); err == nil {
			return nil
		}
		time.Sleep(1 * time.Second)
	}
	return errors.New("postgres did not report ready via pg_isready")
}

func waitForPort(addr string, timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", addr, 500*time.Millisecond)
		if err == nil {
			_ = conn.Close()
			return nil
		}
		time.Sleep(300 * time.Millisecond)
	}
	return fmt.Errorf("timeout waiting for %s", addr)
}

func postJSON(t *testing.T, url, token string, body map[string]any) map[string]any {
	t.Helper()
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return doJSON(t, req)
}

func getJSON(t *testing.T, url, token string) map[string]any {
	t.Helper()
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return doJSON(t, req)
}

func doJSON(t *testing.T, req *http.Request) map[string]any {
	t.Helper()
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("http do %s %s: %v", req.Method, req.URL.String(), err)
	}
	defer resp.Body.Close()
	payload, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	var out map[string]any
	if err := json.Unmarshal(payload, &out); err != nil {
		t.Fatalf("unmarshal json (%s): %v", string(payload), err)
	}
	return out
}
