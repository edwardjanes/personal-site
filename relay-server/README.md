# Relay Server

HTTP relay server that proxies API requests to Google Apps Script, bypassing CORS restrictions.

## Local Development

```bash
python3 relay_server.py
```

Server runs at `http://localhost:8080` and provides:
- `GET /api/get` — forwards to Google Apps Script doGet()
- `POST /api/post` — forwards to Google Apps Script doPost()

## Railway Deployment

1. Connect this repo to Railway
2. Railway auto-detects Procfile and deploys
3. Copy the public Railway URL
4. Update dashboard's API_BASE with the Railway URL

## Environment Variables

Edit the `GOOGLE_APPS_SCRIPT_URL` constant in `relay_server.py` to point to your deployed Apps Script endpoint.
