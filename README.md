# Instapaper Hub

A lightweight web tool for adding links to Instapaper from external networks...

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

**Note:** wrangler requires macOS 13.5+ or Linux. If you're on an older macOS version, consider using a DevContainer setup.

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
