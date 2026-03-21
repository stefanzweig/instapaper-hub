# Instapaper Hub - Design Specification

**Date**: 2026-03-21
**Status**: Draft

---

## 1. Project Overview

**Project Name**: Instapaper Hub

**Goal**: A lightweight web tool deployed on Cloudflare Pages that allows adding links to your Instapaper account from external networks.

**Core Features**:
- Input URL to add to Instapaper
- Optional tags input (comma-separated)
- Display success/failure status
- No article list display (initial version)

**Deployment Platform**: Cloudflare Pages + Pages Functions

---

## 2. Architecture

**Overall Architecture**:
```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────┐
│   User Browser  │ ──► │  Cloudflare Pages        │ ──► │  Instapaper API │
│                 │     │  + Pages Functions       │     │                 │
└─────────────────┘     │  - static/index.html     │     │  - /api2/oauth/token
                        │  - /api/add.js           │     │  - /api2/add      │
                        └──────────────────────────┘     └─────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │  Cloudflare Environment  │
                        │  Variables:              │
                        │  - INSTAPAPER_USERNAME   │
                        │  - INSTAPAPER_PASSWORD   │
                        │  - INSTAPAPER_CLIENT_ID  │
                        │  - INSTAPAPER_CLIENT_SECRET │
                        └──────────────────────────┘
```

**Request Flow**:
1. User visits page → loads static HTML
2. User submits URL + tags → POST `/api/add`
3. Pages Function gets/refreshes token → calls Instapaper API
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
│  Tags (Optional, comma-separated)       │
│  ┌─────────────────────────────────┐   │
│  │ technology, ai, reading         │   │
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
| Receive POST request | body: `{ url, tags }` |
| Get/refresh token | Read credentials from env, call OAuth endpoint |
| Call Instapaper API | POST `/api2/add` with url and tags |
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
  "url": "https://example.com/article",
  "tags": "technology, ai, reading"
}
```

**Response Format**:
```json
// Success
{
  "success": true,
  "message": "Successfully added to Instapaper",
  "instapaper_id": "12345678"
}

// Error
{
  "success": false,
  "message": "Error: Invalid URL or network error"
}
```

### 4.2 Instapaper API Call Sequence

```
┌─────────────────────────────────────────────────────────────┐
│  Pages Function /api/add                                    │
├─────────────────────────────────────────────────────────────┤
│  1. POST https://www.instapaper.com/api2/oauth/token        │
│     Body: username, password, client_id, client_secret      │
│     → Returns { access_token: "xxx" }                       │
│                                                             │
│  2. POST https://www.instapaper.com/api2/add                │
│     Headers: Authorization "Bearer {access_token}"          │
│     Body: url, tags                                         │
│     → Returns { digest: "...", item_id: "12345" }           │
│                                                             │
│  3. Return result to frontend                               │
└─────────────────────────────────────────────────────────────┘
```

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
| 401 Unauthorized | Wrong credentials |提示 check environment variables |
| 403 Forbidden | Invalid/expired token | Try refreshing token |
| 429 Too Many Requests | API rate limit | Return rate limit message |
| 500 Internal | Server error | Return generic error message |

### 5.3 Token Refresh Strategy

**Initial Version**: Re-fetch token on every request
- Instapaper OAuth tokens don't expire frequently
- Simplest implementation
- Can optimize later with KV caching if needed

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

- ✅ Add URL (no tags)
- ✅ Add URL (with tags)
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
- `INSTAPAPER_CLIENT_ID`
- `INSTAPAPER_CLIENT_SECRET`

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
