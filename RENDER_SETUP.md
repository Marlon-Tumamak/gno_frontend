# Render Setup - Step by Step

## 1. Create Web Service

In Render Dashboard:
- Click **New +**
- Select **Web Service**
- Connect your repository

## 2. Basic Settings

```
Service Name:     ong-trucking-frontend
Root Directory:   frontend
Environment:      Node
Branch:           main
```

## 3. Build & Start Commands

```
Build Command:    npm install && npm run build
Start Command:    npm start
```

## 4. Environment Variables

Click **"Advanced"** or go to **"Environment"** tab

Add this variable:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |

**⚠️ IMPORTANT:** 
- Replace `your-backend.onrender.com` with your actual backend URL
- Do NOT add trailing slash
- Example: `https://gno-backend.onrender.com`

## 5. Plan Selection

Select **Free** (or your preferred plan)

## 6. Create Service

Click **"Create Web Service"**

Wait 5-10 minutes for deployment.

## 7. Get Your URL

After deployment, your app will be at:
```
https://ong-trucking-frontend.onrender.com
```
(Or the custom name you chose)

## 8. Update Backend CORS

**CRITICAL STEP:** Update your backend's CORS settings

### Option A: If using Render backend
1. Go to your backend service in Render
2. Go to **Environment** tab
3. Update or add:
   ```
   FRONTEND_URL=https://ong-trucking-frontend.onrender.com
   ```
4. In your backend code (`settings_production.py`):
   ```python
   CORS_ALLOWED_ORIGINS = [
       os.environ.get('FRONTEND_URL'),
       "http://localhost:3000",
   ]
   ```

### Option B: Manually update backend
Edit `backend/ong_backend/ong_backend/settings_production.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",
    "http://localhost:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",
]
```

Redeploy backend after changing.

## 9. Test Your Deployment

Visit your frontend URL and test:
- ✅ Home page loads
- ✅ Dashboard accessible
- ✅ Upload page loads
- ✅ Accounts page shows data
- ✅ Trips page shows data
- ✅ Revenue page shows data

## 🔧 Troubleshooting

### Can't fetch data from backend?

1. **Check browser console (F12)**
   - Look for CORS errors
   - Check the API URL being called

2. **Verify environment variable**
   - Go to Render → Your Service → Environment
   - Check `NEXT_PUBLIC_API_URL` is correct
   - Must NOT have trailing slash

3. **Check backend CORS**
   - Backend must allow your frontend domain
   - Check backend logs for errors

4. **Redeploy if needed**
   - After changing environment variables
   - Click "Manual Deploy" → "Deploy latest commit"

### Service taking long to respond?

This is normal on free tier:
- Services sleep after 15 min inactivity
- First request wakes it up (30-60 seconds)
- Consider paid plan for always-on service

## 📝 Summary

Your frontend is now deployed! 

- **Frontend URL:** `https://ong-trucking-frontend.onrender.com`
- **Backend URL:** `https://your-backend.onrender.com`
- **Environment Variable:** `NEXT_PUBLIC_API_URL` set to backend URL
- **Backend CORS:** Updated to allow frontend domain

## 🎉 Next Steps

1. Test all functionality
2. Enable Auto-Deploy for automatic updates
3. Set up custom domain (optional)
4. Monitor logs for any issues

---

**Need more help?** Check `DEPLOYMENT.md` for detailed troubleshooting.

