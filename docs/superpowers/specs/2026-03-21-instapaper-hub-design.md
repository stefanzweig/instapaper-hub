# Instapaper Hub - Design Specification

**Date**: 2026-03-21
**Status**: Approved

---

## 1. Project Overview

**Project Name**: Instapaper Hub

**Goal**: A lightweight web tool deployed on Cloudflare Pages that allows adding links to your Instapaper account from external networks.

**Core Features**:
- Input URL to add to Instapaper
- Display success/failure status
- No article list display (initial version)
- No tags support (v1 uses Simple API for simplicity)

**Deployment Platform**: Cloudflare Pages + Pages Functions

**API Choice**: Instapaper Simple API (`/api/add`) with HTTP Basic Auth
- Simpler implementation (no OAuth 1.0a signing required)
- Trade-off: tags not supported in Simple API

---

## 2. Architecture

**Overall Architecture**:
```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   User Browser  │ ──► │  Cloudflare Pages        │ ──► │  Instapaper API │
│                 │     │  + Pages Functions       │     │                 │
└─────────────────┘     │  - static/index.html     │     │  - /api/add     │
                        │  - /api/add.js           │     │                 │
                        └──────────────────────────┘     └─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │  Cloudflare Environment  │
                        │  Variables:              │
                        │  - INSTAPAPER_USERNAME   │
                        │  - INSTAPAPER_PASSWORD   │
                        └──────────────────────────┘
```

**Request Flow**:
1. User visits page → loads static HTML
2. User submits URL → POST `/api/add`
3. Pages Function calls Instapaper Simple API with HTTP Basic Auth
4. Returns JSON result → frontend displays success/failure

---

## 3. Component Design

### 3.1 Frontend Component (`public/index.html`)

**UI Layout**:
```
┌─────────────────────────────────────────┐
│         Instapaper Hub                  │
├─────────────────────────────────────────┤
│                                         │
│  URL (Required)                         │
│  ┌─────────────────────────────────┐   │
│  │ https://example.com/article     │   │
│  └─────────────────────────────────┘   │
│                                         │
│         [ Add to Instapaper ]           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ✓ Successfully added!          │   │  ← Status display
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 Backend Function (`functions/api/add.js`)

| Responsibility | Description |
|----------------|-------------|
| Receive POST request | body: `{ url }` |
| Call Instapaper Simple API | POST `/api/add` with HTTP Basic Auth |
| Return result | `{ success: true/false, message: string }` |

### 3.3 File Structure

```
instapaper-hub/
├── functions/
│   └── api/
│       └── add.js
├── public/
│   └── index.html
├── wrangler.toml
├── package.json
└── .dev.vars (local dev env vars, not committed)
```

---

## 4. API Design

### 4.1 Cloudflare Function Endpoint

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/add` | POST | Add URL to Instapaper |

**Request Format** (`POST /api/add`):
```json
{
  "url": "https://example.com/article"
}
```

**Response Format**:
```json
// Success
{
  "success": true,
  "message": "Successfully added to Instapaper"
}

// Error
{
  "success": false,
  "message": "Error: Invalid URL or network error"
}
```

### 4.2 Instapaper Simple API Call

```
┌─────────────────────────────────────────────────────────────┐
│  Pages Function /api/add                                    │
├─────────────────────────────────────────────────────────────┤
│  POST https://www.instapaper.com/api/add                    │
│  Headers: Authorization "Basic base64(username:password)"   │
│  Body: url={encoded_url}                                    │
│                                                             │
│  → Returns: "200 OK" or error status                        │
│                                                             │
│  Return result to frontend                                  │
└─────────────────────────────────────────────────────────────┘
```

**Note**: Instapaper Simple API only requires HTTP Basic Auth with username/password.
No OAuth token exchange needed.

---

## 5. Error Handling

### 5.1 Frontend Error Handling
- URL format validation (HTML5 `type="url"` + frontend check)
- Network error display
- API error message display

### 5.2 Backend Error Scenarios

| Error Type | Cause | Handling |
|------------|-------|----------|
| 400 Bad Request | Invalid URL format | Return specific error message |
| 401 Unauthorized | Wrong credentials | Return error message |
| 429 Too Many Requests | API rate limit | Return rate limit message |
| 500 Internal | Server error | Return generic error message |

### 5.3 Authentication Strategy

**Simple API with HTTP Basic Auth**:
- No OAuth token exchange needed
- Username/password sent with each request via Basic Auth header
- Simpler implementation, no token storage required

---

## 6. Testing Strategy

### 6.1 Local Development Testing

| Test Item | Method |
|-----------|--------|
| Environment setup | `wrangler pages dev` local run |
| Frontend UI | Manual form submission test |
| API call | Test `/api/add` with curl/Postman |
| Error scenarios | Pass invalid URL, verify error handling |

### 6.2 Pre-deployment Verification

- [ ] All environment variables correctly configured in Cloudflare
- [ ] Local tests pass
- [ ] Manual test after production deployment

### 6.3 Test Scope (Initial Version)

- ✅ Add URL
- ✅ Invalid URL error handling
- ✅ Authentication failure error handling

---

## 7. Deployment & Operations

### 7.1 Deployment Flow

```bash
# 1. Install dependencies
npm install

# 2. Local development
npm run dev

# 3. Deploy to Cloudflare Pages
npm run deploy
```

### 7.2 Environment Variables Configuration

Set in Cloudflare Dashboard:
- `INSTAPAPER_USERNAME`
- `INSTAPAPER_PASSWORD`

### 7.3 Git Configuration

```gitignore
# .gitignore
node_modules/
.dev.vars
.wrangler/
.superpowers/
```

### 7.4 Monitoring & Maintenance

- Cloudflare Functions built-in logging (view in Dashboard)
- Error rate monitoring: observe 5xx response ratio
- Regular dependency updates

---

## 8. Future Considerations (Out of Scope for v1)

- [ ] Article list display
- [ ] Article management (archive, delete, favorite)
- [ ] User authentication for the web tool
- [ ] Token caching with Cloudflare KV
- [ ] Browser extension
- [ ] Tags support (requires Full OAuth API)
