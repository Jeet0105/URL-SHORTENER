# 🔗 URL Shortener API

A fast, production-ready URL shortener REST API built with Node.js, Express 5, and MongoDB — featuring an O(1) LFU cache for high-performance redirects.

## Tech Stack

| Layer          | Technology            |
| -------------- | --------------------- |
| Runtime        | Node.js (ES Modules)  |
| Framework      | Express 5             |
| Database       | MongoDB Atlas (Mongoose 9) |
| ID Generation  | nanoid (8-char IDs)   |
| Caching        | Custom LFU Cache      |
| Config         | dotenv                |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (or a local MongoDB instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/Jeet0105/URL-SHORTENER.git
cd <folder_path>

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
```

### Running the Server

```bash
node index.js
```

The server will start at `http://localhost:5000`.

## API Reference

Base URL: `/api/v1/url`

### Create Short URL

```
POST /api/v1/url/
```

**Request Body:**

```json
{
  "redirectURL": "https://example.com/some/long/url"
}
```

**Responses:**

| Status | Description                        | Body                        |
| ------ | ---------------------------------- | --------------------------- |
| 201    | Short URL created                  | `{ "shortId": "aBcDeFgH" }` |
| 200    | URL already exists, returns existing | `{ "shortId": "aBcDeFgH" }` |
| 400    | Missing `redirectURL`              | `{ "error": "..." }`       |
| 500    | Server error                       | `{ "error": "..." }`       |

---

### Redirect to Original URL

```
GET /api/v1/url/:shortId
```

Redirects (HTTP 302) to the original URL and increments the click counter.

**Responses:**

| Status | Description       |
| ------ | ----------------- |
| 302    | Redirect          |
| 404    | Short URL not found |

---

### Get URL Statistics

```
GET /api/v1/url/stats/:shortId
```

**Response (200):**

```json
{
  "shortId": "aBcDeFgH",
  "redirectURL": "https://example.com/some/long/url",
  "clickCount": 42
}
```

---

### Delete Short URL

```
DELETE /api/v1/url/:shortId
```

**Responses:**

| Status | Description                    | Body                                    |
| ------ | ------------------------------ | --------------------------------------- |
| 200    | Deleted successfully           | `{ "message": "URL deleted successfully" }` |
| 404    | Short URL not found            | `{ "error": "URL not found" }`          |

---

### Health Check

```
GET /health
```

**Response (200):**

```json
{ "status": "UP" }
```

## Project Structure

```
02URLSHORTEN/
├── index.js                  # Entry point — Express server setup
├── .env                      # Environment variables (not committed)
├── .gitignore                # Ignores node_modules and .env
├── package.json              # Dependencies & project metadata
├── controller/
│   └── url.controller.js     # Business logic (create, redirect, stats, delete)
├── model/
│   └── url.model.js          # Mongoose schema (redirectURL, shortId, clickCount)
├── routes/
│   └── url.route.js          # Route definitions
└── utils/
    ├── connectDB.js          # MongoDB connection helper (with pool config)
    └── lfuCache.js           # O(1) LFU cache implementation
```

## Architecture & Design

### LFU Cache

The API uses a custom **Least Frequently Used** cache (capacity: 100) that sits in front of MongoDB for redirect lookups and stats queries. Key design choices:

- **O(1) eviction** — Uses a frequency bucket map (`freq → Set<key>`) with a `minFreq` tracker, avoiding O(n) scans.
- **Async DB updates** — On a cache hit during redirect, the click count is updated in the database asynchronously (fire-and-forget) to avoid blocking the response.
- **Tie-breaking** — When multiple entries share the lowest frequency, the oldest one (by insertion order) is evicted, leveraging JavaScript `Set` iteration order.

### Collision Handling

`nanoid` generates 8-character random IDs. In the unlikely event of a collision, the create endpoint retries up to **5 times** before returning an error. Duplicate `redirectURL` submissions are handled gracefully by returning the existing short ID.

### Database

The Mongoose schema enforces uniqueness on both `shortId` and `redirectURL` via unique indexes, providing a safety net against race conditions in concurrent environments.

## License

ISC

---

Created with ❤️ by Jeet
