# Social Backend API

A Node.js Express API with JWT authentication and Swagger (OpenAPI 3) documentation for a social feed and friends experience.

## Features

- 🔐 JWT-based authentication (HS256)
- 📚 Swagger/OpenAPI 3 documentation with interactive UI
- 👥 Friends management (current friends, suggestions, requests)
- 📝 Social feed with posts and comments
- 🔍 Pagination and filtering support
- 🗄️ SQLite data store managed with Knex migrations and seeds
- ⏰ ISO 8601 timestamps with relative time helpers

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd my-social-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```bash
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
```

4. Run the database migrations and seed data:
```bash
npm run migrate
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Documentation

Once the server is running:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/openapi.json

## Authentication

### Password Storage

Passwords are hashed using bcrypt (10 rounds) and stored in the SQLite database.

**Seed Users** (loaded via `npx knex seed:run`):
- Username: `alex`, Password: `password`
- Username: `sarah`, Password: `password`

### Getting a Token

1. **Register a new user**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "securepassword"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "7",
    "username": "newuser"
  }
}
```

2. **Login with existing user**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alex", "password": "password"}'
```

### Using the Token

All protected endpoints require a Bearer token in the Authorization header:

```bash
curl -X GET http://localhost:3000/friends \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Friends

- `GET /friends` - Get current friends (supports `status`, `search`, `limit`, `offset` query params)
- `GET /friends/suggestions` - Get friend suggestions (supports `limit`, `offset`)
- `GET /friends/requests` - Get pending friend requests (supports `type`, `limit`, `offset`)

### Posts

- `GET /posts` - Get feed posts (supports `limit`, `offset`)

### Other

- `GET /health` - Health check endpoint
- `GET /docs` - Swagger UI
- `GET /openapi.json` - OpenAPI 3 specification

## Example Flow

```bash
# 1. Register or login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alex", "password": "password"}' | jq -r '.token')

# 2. Get friends
curl -X GET http://localhost:3000/friends \
  -H "Authorization: Bearer $TOKEN"

# 3. Get friend suggestions
curl -X GET http://localhost:3000/friends/suggestions \
  -H "Authorization: Bearer $TOKEN"

# 4. Get friend requests
curl -X GET http://localhost:3000/friends/requests \
  -H "Authorization: Bearer $TOKEN"

# 5. Get posts feed
curl -X GET http://localhost:3000/posts \
  -H "Authorization: Bearer $TOKEN"
```

## Data Models

### Friend
```json
{
  "id": "string",
  "username": "string",
  "profileImage": "string (emoji or URL)",
  "status": "online | offline",
  "mutualFriends": "number"
}
```

### FriendSuggestion
```json
{
  "id": "string",
  "username": "string",
  "profileImage": "string",
  "mutualFriends": "number"
}
```

### PendingRequest
```json
{
  "id": "string",
  "username": "string",
  "profileImage": "string",
  "mutualFriends": "number",
  "type": "incoming | outgoing",
  "sentAt": "ISO 8601 timestamp",
  "relativeTimestamp": "string (e.g., '2h ago')"
}
```

### Post
```json
{
  "id": "string",
  "username": "string",
  "profileImage": "string",
  "timestamp": "ISO 8601 timestamp",
  "relativeTimestamp": "string",
  "text": "string",
  "likes": "number",
  "comments": "Comment[]"
}
```

## Error Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "error_code_snake_case",
    "message": "Human-readable description",
    "details": { "optional": "additional details" }
  }
}
```

Common error codes:
- `unauthorized` - Missing or invalid authentication
- `validation_error` - Request validation failed
- `username_taken` - Username already exists
- `invalid_credentials` - Invalid username or password
- `not_found` - Route not found

## Seed Data

The Knex seed script populates the database with:
- Auth-ready users (`alex` / `password`, `sarah` / `password`)
- Friends, suggestions, and pending requests for both users
- Social posts, comments, and like interactions

Feel free to modify `seeds/initial_data.js` to adjust the starting dataset.

## Development

### Project Structure

```
my-social-backend/
├── server.js           # Main Express server
├── swagger.js          # Swagger/OpenAPI configuration
├── db/
│   └── knex.js         # Knex instance
├── migrations/         # Database schema migrations
├── seeds/              # Database seed data
├── routes/
│   ├── auth.js        # Authentication routes
│   ├── friends.js     # Friends endpoints
│   └── posts.js       # Posts endpoints
├── middleware/
│   └── auth.js        # JWT authentication middleware
├── utils/
│   └── time.js        # Relative time helpers
├── package.json
├── knexfile.js
└── README.md
```

### Environment Variables

- `JWT_SECRET` - Secret key for JWT signing (default: `default-secret-key-change-in-production`)
- `PORT` - Server port (default: `3000`)

## Security Notes

- **JWT_SECRET**: Change the default secret in production
- **Password Hashing**: Uses bcrypt with 10 rounds
- **CORS**: Enabled for all origins (adjust in production)
- **Token Expiry**: JWT tokens expire after 7 days

## License

ISC

