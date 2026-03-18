# Lair - Go WebSocket & Auth API

## Project Overview
A Go backend server built with Gin framework, featuring:
- JWT-based authentication (register/login)
- Google OAuth 2.0
- WebSocket support (hub/room/client pattern)
- PostgreSQL database via pgx/v5

## Architecture

- **`server/`** - Main Go backend (Gin + pgx + gorilla/websocket)
  - `cmd/main.go` - Entry point, route setup
  - `internals/controllers/authController/` - Register, Login, Google OAuth handlers
  - `internals/middlewares/authMiddleware/` - JWT cookie auth middleware
  - `internals/database/` - pgxpool connection
  - `internals/models/authModel/` - User model
  - `internals/utils/authUtils/` - Password hashing, JWT generation/verification
  - `internals/oauth/` - Google OAuth config
  - `websocket/` - Hub, Room, Client WebSocket infrastructure
  - `migrations/` - Goose SQL migrations
- **`meen/`** and **`sukh/`** - Node.js WebSocket test clients (development/testing only)

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Replit) |
| `PORT` | Server port (set to 8080) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `CALLBACK_URL` | Base URL for OAuth callback |
| `FRONTEND_URL` | Frontend URL for redirects after OAuth |

## Database
- Replit built-in PostgreSQL
- Schema: `users` table with UUID primary key, name, email, password (bcrypt), profile_picture
- Extension: `uuid-ossp`

## Running
- Workflow: `cd server && GOPATH=/tmp/gopath go run ./cmd/` on port 8080
- Go module: `github.com/DeepanshuChaid/Lair`

## API Endpoints
- `GET /` - Health check
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/google` - Google OAuth redirect
- `GET /auth/google/callback` - Google OAuth callback
- `GET /api/user` - Protected user info (requires JWT cookie)
