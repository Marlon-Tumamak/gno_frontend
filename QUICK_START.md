# 🚀 Quick Start - Deploy Frontend to Render

## Prerequisites
- ✅ Code pushed to GitHub/GitLab
- ✅ Backend deployed (get the URL)
- ✅ Render account created

## Deploy in 5 Minutes

### 1. Go to Render
```
https://dashboard.render.com
```

### 2. Create Web Service
Click: **New +** → **Web Service** → Select your repository

### 3. Configure

| Setting | Value |
|---------|-------|
| **Name** | `ong-trucking-frontend` |
| **Root Directory** | `frontend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

### 4. Add Environment Variable

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | Your backend URL (e.g., `https://gno-backend.onrender.com`) |

⚠️ **Important**: No trailing slash!

### 5. Click "Create Web Service"

Wait 5-10 minutes for deployment ☕

### 6. Update Backend CORS

In your backend `settings_production.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",  # Your frontend URL
    "http://localhost:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",  # Your frontend URL
]
```

Redeploy backend after updating.

## 🎉 Done!

Your app is live at: `https://ong-trucking-frontend.onrender.com`

## 🐛 Troubleshooting

**Can't fetch data?**
- Check browser console (F12)
- Verify `NEXT_PUBLIC_API_URL` in Render
- Confirm backend CORS settings
- Check backend is running

**Need help?** See `DEPLOYMENT.md` for detailed guide.

---

## What Changed?

All API calls now use `process.env.NEXT_PUBLIC_API_URL`:

**Before:**
```typescript
fetch('http://127.0.0.1:8000/api/v1/trips/')
```

**After:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
fetch(`${apiUrl}/api/v1/trips/`)
```

This allows the app to work in both development and production! 🎯

