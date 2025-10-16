# ONG Trucking Frontend - Quick Deployment Guide

## 🚀 Quick Start Deployment to Render

### Step 1: Prerequisites
- [ ] Render account created at https://render.com
- [ ] Code pushed to GitHub/GitLab
- [ ] Backend URL available (e.g., `https://your-backend.onrender.com`)

### Step 2: Deploy to Render

1. **Go to Render Dashboard**
   ```
   https://dashboard.render.com
   ```

2. **Click "New +" → "Web Service"**

3. **Connect Repository** and select this repository

4. **Configure Build Settings:**
   ```
   Name:             ong-trucking-frontend
   Root Directory:   frontend
   Runtime:          Node
   Build Command:    npm install && npm run build
   Start Command:    npm start
   Branch:           main (or your branch name)
   ```

5. **Add Environment Variable:**
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.onrender.com
   ```
   ⚠️ **IMPORTANT:** Replace with your actual backend URL!

6. **Click "Create Web Service"**

7. **Wait** for deployment (5-10 minutes)

8. **Done!** Your app will be available at:
   ```
   https://ong-trucking-frontend.onrender.com
   ```

### Step 3: Update Backend CORS

After deployment, update your Django backend to allow the frontend domain:

In your backend's `settings_production.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",  # Your actual frontend URL
    "http://localhost:3000",
]

CSRF_TRUSTED_ORIGINS = [
    "https://ong-trucking-frontend.onrender.com",  # Your actual frontend URL
]
```

Redeploy your backend after making this change.

## 🔧 Environment Variables Explained

### `NEXT_PUBLIC_API_URL`
- **Required:** Yes
- **Description:** Backend API URL
- **Format:** Must NOT include trailing slash
- **Example:** `https://gno-backend.onrender.com`
- **Note:** MUST start with `NEXT_PUBLIC_` to be accessible in browser

## 📝 Common Issues & Solutions

### Issue: "Failed to fetch" errors
**Solution:** 
1. Check backend is running
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Check backend CORS settings
4. Look at browser console for specific errors

### Issue: Build fails
**Solution:**
1. Check Render logs
2. Verify all dependencies in `package.json`
3. Try building locally: `npm run build`

### Issue: Environment variables not working
**Solution:**
1. Ensure variable name starts with `NEXT_PUBLIC_`
2. Redeploy after changing environment variables
3. Clear browser cache

### Issue: App loads but no data
**Solution:**
1. Open browser DevTools → Network tab
2. Check if API calls are being made
3. Verify API URL in the requests
4. Check backend logs for errors

## 🆓 Free Tier Notes

Render free tier:
- Spins down after 15 min of inactivity
- First request after may take 30-60 seconds
- This is normal behavior

## 📦 Local Development

To run locally:

```bash
cd frontend
npm install
npm run dev
```

Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 🔄 Updating Your Deployment

1. Make code changes
2. Commit and push to your repository
3. Render auto-deploys (if enabled)
4. Or click "Manual Deploy" in Render dashboard

## ✅ Post-Deployment Checklist

- [ ] Frontend URL is accessible
- [ ] Login/authentication works
- [ ] Dashboard loads
- [ ] Upload page works
- [ ] Accounts page displays data
- [ ] Trips page displays data
- [ ] Revenue page displays data
- [ ] All navigation links work

## 📚 Additional Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Render Documentation](https://render.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Need Help?

Check the detailed `DEPLOYMENT.md` file for more troubleshooting steps.

