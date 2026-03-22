  Files created

  backend-go/
  ├── main.go                          — HTTP server, all routes, CORS
  ├── go.mod / go.sum                  — dependencies
  └── internal/
      ├── db/db.go                     — MongoDB connection
      ├── models/
      │   ├── user.go                  — User struct
      │   ├── item.go                  — Item struct
      │   └── receipt.go               — Receipt + PopulatedReceipt structs
      ├── middleware/auth.go            — JWT verify, AdminAuth, CreateToken
      └── handlers/
          ├── user.go                  — user endpoints
          ├── item.go                  — item endpoints
          └── receipt.go               — receipt endpoints

  API endpoints — identical to JS version

  All routes preserved (/api/users, /api/items, /api/receipts).

  Multi-user handling added

  - GET /api/users/all — new admin-only endpoint (requires isAdmin: true in JWT) that lists all registered users with
  passwords excluded via DB projection
  - AdminAuth() middleware — enforces admin-only routes, returns 403 forbidden for non-admins
  - All data is scoped to the authenticated user via the JWT id claim (same as JS)

  Key differences from JS

  ┌────────────────────┬──────────────────────────────┬──────────────────────────────────────────────────────────┐
  │        Area        │              JS              │                            Go                            │
  ├────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Barcode check      │ Puppeteer + Google scrape    │ Length validation only (12–13 chars)                     │
  ├────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Receipt populate   │ Mongoose .populate()         │ 2-query manual join (fetch receipts → batch-fetch items) │
  ├────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ IsResolved default │ Mongoose schema default true │ *bool input, defaults to true if absent                  │
  ├────────────────────┼──────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ Google OAuth       │ google-auth-library          │ tokeninfo HTTP endpoint                                  │
  └────────────────────┴──────────────────────────────┴──────────────────────────────────────────────────────────┘

  To run

  cd backend-go
  # copy/create .env with same vars as JS backend
  go run main.go
Postgres (local via Docker)

- Start Postgres on local port `5432`:

  ```bash
  cd backend-go
  docker compose -f docker-compose.postgres.yml up -d
  ```

- Connection URL for this container:

  ```
  postgres://bc_pos_user:bc_pos_password@localhost:5432/bc_pos?sslmode=disable
  ```

- Configure backend to use Postgres (example):

  ```bash
  cp .env.postgres.example .env
  # then run backend as usual
  go run main.go
  ```
