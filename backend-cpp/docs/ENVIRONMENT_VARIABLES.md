# Environment Variables for `backend-cpp`

The converted Drogon backend uses the following env vars.

## Required
- `PORT`: HTTP port to bind the API server.

## Optional (for parity with `backend-go` behavior)
- `DB_DRIVER`: expected DB driver identifier (e.g., `postgres`).
- `POSTGRES_URL`: PostgreSQL connection string if you add DB integration.
- `JWT_SECRET`: key used for JWT signing/verification if auth is implemented.
- `LOG_LEVEL`: Drogon logging level (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`).

## Example

```bash
PORT=3001
DB_DRIVER=postgres
POSTGRES_URL=postgresql://user:password@localhost:5432/bcpos
JWT_SECRET=change_me
LOG_LEVEL=INFO
```
