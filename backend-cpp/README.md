# backend-cpp (Drogon + C++20)

This directory contains a C++20 Drogon-based backend replacement for `backend-go`.

## Build

```bash
cd backend-cpp
cmake -S . -B build -G Ninja
cmake --build build
```

## Run

```bash
PORT=3001 ./build/bc_pos_backend_cpp
```

## API docs (Swagger UI)

- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI spec: `http://localhost:3001/api/openapi.json`

## Notes

- Route structure mirrors the original Go backend endpoints.
- Current implementation provides route scaffolding and response contract shape (`{"result": ...}`).
