# Instapaper Hub Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Cloudflare Pages web tool that allows adding links to Instapaper from external networks.

**Architecture:** Static HTML frontend served by Cloudflare Pages, with a Pages Function backend that calls Instapaper Simple API using HTTP Basic Auth. All credentials stored in Cloudflare environment variables, never exposed to frontend.

**Tech Stack:** Cloudflare Pages, Pages Functions (JavaScript), Instapaper Simple API, wrangler for local development and deployment.

---

## File Structure

**Files to create:**
- `package.json` - Project dependencies and scripts
- `wrangler.toml` - Cloudflare Pages configuration
- `public/index.html` - Frontend UI
- `functions/api/add.js` - Backend function to call Instapaper API
- `.dev.vars` - Local development environment variables (not committed)
- `.gitignore` - Git ignore patterns
- `docs/superpowers/plans/2026-03-21-instapaper-hub.md` - This plan file

**Existing files:**
- `docs/superpowers/specs/2026-03-21-instapaper-hub-design.md` - Design specification

---

## Chunk 1: Project Setup

### Task 1: Initialize package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "instapaper-hub",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler pages dev public --persist",
    "deploy": "wrangler pages deploy public"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add package.json with wrangler dependency"
```

### Task 2: Create wrangler.toml

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Create wrangler.toml**

```toml
name = "instapaper-hub"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./public"

[vars]
# Environment variables must be set in Cloudflare Dashboard for production
# INSTAPAPER_USERNAME = "your-username"
# INSTAPAPER_PASSWORD = "your-password"
```

- [ ] **Step 2: Commit**

```bash
git add wrangler.toml
git commit -m "chore: add wrangler.toml configuration"
```

### Task 3: Create .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
node_modules/
.dev.vars
.wrangler/
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore"
```

### Task 4: Install dependencies

**Files:**
- Modify: `package.json` (dependencies installed)

- [ ] **Step 1: Install wrangler**

```bash
npm install
```

Expected: wrangler installed in node_modules

- [ ] **Step 2: Verify wrangler is installed**

```bash
npx wrangler --version
```

Expected: Version number printed

- [ ] **Step 3: Commit**

```bash
git add package-lock.json
git commit -m "chore: install dependencies"
```

---

## Chunk 2: Backend Function

### Task 5: Create Pages Function

**Files:**
- Create: `functions/api/add.js`
- Create: `.dev.vars`

- [ ] **Step 1: Create .dev.vars for local development**

```
INSTAPAPER_USERNAME=your-actual-username
INSTAPAPER_PASSWORD=your-actual-password
```

Note: Replace with your actual Instapaper credentials. This file is in .gitignore.

- [ ] **Step 2: Create functions/api/add.js**

```javascript
export async function onRequestPost({ env, request }) {
  const { url } = await request.json();

  // Validate URL
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid or missing URL'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Call Instapaper Simple API
    const response = await fetch('https://www.instapaper.com/api/add', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${env.INSTAPAPER_USERNAME}:${env.INSTAPAPER_PASSWORD}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(url)}`
    });

    if (response.status === 200) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully added to Instapaper'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle error responses
    let errorMessage = 'Failed to add to Instapaper';
    if (response.status === 400) {
      errorMessage = 'Invalid URL';
    } else if (response.status === 401) {
      errorMessage = 'Authentication failed. Check credentials.';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded. Try again later.';
    }

    return new Response(JSON.stringify({
      success: false,
      message: errorMessage
    }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Network error: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/add.js .dev.vars
git commit -m "feat: add Pages Function for Instapaper API"
```

### Task 6: Test Backend Function locally

**Files:**
- Modify: `functions/api/add.js` (if fixes needed)

- [ ] **Step 1: Start local dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:8788

- [ ] **Step 2: Test with valid URL**

```bash
curl -X POST http://localhost:8788/api/add \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Expected: `{"success":true,"message":"Successfully added to Instapaper"}`

- [ ] **Step 3: Test with invalid URL**

```bash
curl -X POST http://localhost:8788/api/add \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-url"}'
```

Expected: `{"success":false,"message":"Invalid URL"}` with status 400

- [ ] **Step 4: Test with missing URL**

```bash
curl -X POST http://localhost:8788/api/add \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `{"success":false,"message":"Invalid or missing URL"}` with status 400

- [ ] **Step 5: Stop dev server and commit any fixes**

```bash
# Press Ctrl+C to stop dev server
git add functions/api/add.js
git commit -m "fix: handle edge cases in API function"
```

---

## Chunk 3: Frontend UI

### Task 7: Create index.html

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Create public directory if needed**

```bash
mkdir -p public
```

- [ ] **Step 2: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Instapaper Hub</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      width: 100%;
      max-width: 500px;
    }
    h1 {
      color: #333;
      margin-bottom: 8px;
      font-size: 24px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 32px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }
    input[type="url"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s;
    }
    input[type="url"]:focus {
      outline: none;
      border-color: #333;
    }
    input[type="url"]::placeholder {
      color: #999;
    }
    button {
      width: 100%;
      padding: 14px 24px;
      background: #333;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover {
      background: #555;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .status {
      margin-top: 20px;
      padding: 16px;
      border-radius: 8px;
      display: none;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      display: block;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Instapaper Hub</h1>
    <p class="subtitle">Add links to your Instapaper from anywhere</p>

    <form id="add-form">
      <div class="form-group">
        <label for="url">URL</label>
        <input
          type="url"
          id="url"
          name="url"
          placeholder="https://example.com/article"
          required
        >
      </div>
      <button type="submit" id="submit-btn">Add to Instapaper</button>
    </form>

    <div id="status" class="status"></div>
  </div>

  <script>
    const form = document.getElementById('add-form');
    const urlInput = document.getElementById('url');
    const submitBtn = document.getElementById('submit-btn');
    const statusEl = document.getElementById('status');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const url = urlInput.value.trim();
      if (!url) return;

      // Reset state
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding...';
      statusEl.className = 'status';
      statusEl.textContent = '';

      try {
        const response = await fetch('/api/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.success) {
          statusEl.className = 'status success';
          statusEl.textContent = '✓ ' + data.message;
          urlInput.value = '';
        } else {
          statusEl.className = 'status error';
          statusEl.textContent = '✗ ' + data.message;
        }
      } catch (error) {
        statusEl.className = 'status error';
        statusEl.textContent = '✗ Network error: ' + error.message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add to Instapaper';
      }
    });
  </script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat: add frontend UI"
```

### Task 8: Test Frontend locally

**Files:**
- Modify: `public/index.html` (if fixes needed)

- [ ] **Step 1: Start local dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:8788

- [ ] **Step 2: Open browser to http://localhost:8788**

Verify:
- Page loads with form visible
- URL input field present
- "Add to Instapaper" button visible

- [ ] **Step 3: Test form submission**
1. Enter a valid URL (e.g., https://example.com)
2. Click "Add to Instapaper"
3. Verify success message appears

- [ ] **Step 4: Test error handling**
1. Enter an invalid URL (e.g., "not-a-url")
2. Click submit
3. Verify error message appears

- [ ] **Step 5: Stop dev server and commit any fixes**

```bash
# Press Ctrl+C to stop dev server
git add public/index.html
git commit -m "fix: improve frontend error handling"
```

---

## Chunk 4: Verification & Deployment

### Task 9: Full integration test

**Files:**
- None

- [ ] **Step 1: Start local dev server**

```bash
npm run dev
```

- [ ] **Step 2: Run full test sequence**

```bash
# Test 1: Valid URL
curl -X POST http://localhost:8788/api/add \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test 2: Invalid URL
curl -X POST http://localhost:8788/api/add \
  -H "Content-Type: application/json" \
  -d '{"url": "invalid"}'

# Test 3: Missing URL
curl -X POST http://localhost:8788/api/add \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: All tests return expected responses

- [ ] **Step 3: Stop dev server**

```bash
# Press Ctrl+C
```

### Task 10: Deploy to Cloudflare Pages

**Files:**
- None (deployment)

- [ ] **Step 1: Login to Cloudflare (if not already logged in)**

```bash
npx wrangler login
```

Expected: Browser opens for authentication

- [ ] **Step 2: Deploy to Cloudflare Pages**

```bash
npm run deploy
```

Expected: Deployment succeeds, URL provided

- [ ] **Step 3: Configure environment variables in Cloudflare Dashboard**

Go to Cloudflare Dashboard → Pages → instapaper-hub → Settings → Environment variables

Add:
- `INSTAPAPER_USERNAME` = your Instapaper username
- `INSTAPAPER_PASSWORD` = your Instapaper password

- [ ] **Step 4: Test production deployment**

Open the deployed URL in browser, test with a real URL.

Verify: Link appears in your Instapaper account.

---

## Chunk 5: Documentation

### Task 11: Add README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
# Instapaper Hub

A lightweight web tool for adding links to Instapaper from external networks.

## Features

- Add URLs to your Instapaper account
- Deployed on Cloudflare Pages
- Simple, clean interface

## Prerequisites

- Node.js 18+
- npm
- Cloudflare account
- Instapaper account

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.dev.vars` with your Instapaper credentials:

```
INSTAPAPER_USERNAME=your-username
INSTAPAPER_PASSWORD=your-password
```

3. Start local development server:

```bash
npm run dev
```

4. Open http://localhost:8788

## Deployment

1. Deploy to Cloudflare Pages:

```bash
npm run deploy
```

2. Configure environment variables in Cloudflare Dashboard:
   - `INSTAPAPER_USERNAME`
   - `INSTAPAPER_PASSWORD`

## API

### POST /api/add

Add a URL to Instapaper.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "Successfully added to Instapaper"
}
```

**Response (error):**
```json
{
  "success": false,
  "message": "Error message"
}
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage instructions"
```

### Task 12: Final verification

**Files:**
- None

- [ ] **Step 1: Run git status**

```bash
git status
```

Expected: Working tree clean

- [ ] **Step 2: List all committed files**

```bash
git log --oneline --name-status
```

Expected: All project files committed

- [ ] **Step 3: Verify spec document exists**

```bash
ls docs/superpowers/specs/
```

Expected: `2026-03-21-instapaper-hub-design.md` present

- [ ] **Step 4: Verify plan document exists**

```bash
ls docs/superpowers/plans/
```

Expected: `2026-03-21-instapaper-hub.md` present

---

## Review Checklist

Before marking complete, verify:

- [ ] All tasks completed
- [ ] All tests pass
- [ ] Production deployment working
- [ ] README complete
- [ ] Spec and plan documents committed
