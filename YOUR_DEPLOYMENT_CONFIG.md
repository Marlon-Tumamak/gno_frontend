# 🎯 Your Specific Deployment Configuration

## Environment Variable for Render

When deploying to Render, use this **exact** environment variable:

### In Render Dashboard → Environment Tab:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://gno-backend.onrender.com` |

**⚠️ Important Notes:**
- ✅ No `@` symbol at the beginning
- ✅ No trailing slash at the end
- ✅ Copy exactly as shown above

---

## 🚀 Quick Deploy to Render

### Step 1: Create Web Service
1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your repository

### Step 2: Basic Settings
```
Name:             ong-trucking-frontend
Root Directory:   frontend
Runtime:          Node
Branch:           main (or your branch)
```

### Step 3: Build & Start Commands
```
Build Command:    npm install && npm run build
Start Command:    npm start
```

### Step 4: Environment Variables
Click **"Advanced"** or go to **"Environment"** tab

Add this variable:
```
Key:   NEXT_PUBLIC_API_URL
Value: https://gno-backend.onrender.com
```

### Step 5: Create Service
Click **"Create Web Service"** and wait 5-10 minutes

---

## 🔧 Update Backend CORS (CRITICAL!)

After your frontend deploys, you **MUST** update your backend CORS settings.

### Your Backend: `https://gno-backend.onrender.com`

You need to add your frontend URL to the backend's allowed origins.

#### Option 1: Update Backend Settings File

In your backend project, find `settings_production.py` or `settings.py` and update:

```python
CORS_ALLOWED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",  # Your frontend URL (update after deployment)
    "http://localhost:3000",  # Keep for local dev
    "http://127.0.0.1:3000",  # Keep for local dev
]

CSRF_TRUSTED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",  # Your frontend URL (update after deployment)
]

# Or if you want to be more flexible during development (NOT recommended for production):
# CORS_ALLOW_ALL_ORIGINS = True  # Only for testing, remove in production
```

#### Option 2: Use Environment Variable in Backend

Better approach - use environment variables in your backend:

1. In Render backend service → Environment tab, add:
   ```
   FRONTEND_URL = https://ong-trucking-frontend.onrender.com
   ```

2. In your backend `settings.py`:
   ```python
   import os
   
   FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
   
   CORS_ALLOWED_ORIGINS = [
       FRONTEND_URL,
       "http://localhost:3000",
       "http://127.0.0.1:3000",
   ]
   
   CSRF_TRUSTED_ORIGINS = [
       FRONTEND_URL,
   ]
   ```

**After updating backend settings, redeploy your backend service!**

---

## 📝 Deployment Checklist

- [ ] Code pushed to GitHub/GitLab
- [ ] Render account created
- [ ] Created Web Service in Render
- [ ] Set Root Directory to `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npm start`
- [ ] Added environment variable: `NEXT_PUBLIC_API_URL=https://gno-backend.onrender.com`
- [ ] Clicked "Create Web Service"
- [ ] Waited for deployment (5-10 minutes)
- [ ] Got frontend URL (e.g., `https://ong-trucking-frontend.onrender.com`)
- [ ] Updated backend CORS with frontend URL
- [ ] Redeployed backend
- [ ] Tested frontend - can fetch data from backend
- [ ] Tested all pages work correctly

---

## 🧪 Testing After Deployment

1. **Visit your frontend URL**
2. **Open browser DevTools** (F12) → Console tab
3. **Navigate to different pages**:
   - Dashboard
   - Accounts
   - Trips
   - Revenue
   - Upload

4. **Check for errors**:
   - ✅ No CORS errors
   - ✅ Data loads correctly
   - ✅ API calls succeed

5. **If you see CORS errors**:
   - Double-check backend CORS settings
   - Make sure backend is redeployed
   - Verify frontend URL is correct in backend settings

---

## 🎉 Your URLs

After deployment, you'll have:

- **Frontend**: `https://ong-trucking-frontend.onrender.com` (or your custom name)
- **Backend**: `https://gno-backend.onrender.com` ✅ (already deployed)
- **API Endpoint**: `https://gno-backend.onrender.com/api/v1/`

---

## 📞 Troubleshooting

### Problem: "Failed to fetch" errors

**Solution:**
1. Open browser console (F12)
2. Check the exact error message
3. Verify the API URL being called
4. Check backend CORS settings
5. Ensure backend is running

### Problem: Environment variable not working

**Solution:**
1. Go to Render → Your Service → Environment
2. Verify `NEXT_PUBLIC_API_URL` is set correctly
3. Must NOT have trailing slash
4. After changing, click "Save" and redeploy

### Problem: CORS error in browser

**Solution:**
1. Update backend CORS settings (see above)
2. Redeploy backend after updating
3. Clear browser cache
4. Try again

---

## 🔗 Quick Links

- **Render Dashboard**: https://dashboard.render.com
- **Your Backend**: https://gno-backend.onrender.com
- **Backend API Test**: https://gno-backend.onrender.com/api/v1/

---

**Ready to deploy?** Follow the steps above and you'll be live in 15 minutes! 🚀

If you need more detailed instructions, see `QUICK_START.md` or `RENDER_SETUP.md`.

