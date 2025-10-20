# Deploying Frontend to Render

This guide will help you deploy your Next.js frontend application to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your backend deployed and running (to get the API URL)

## Deployment Steps

### Method 1: Using Render Dashboard (Recommended for First Time)

1. **Log in to Render**
   - Go to https://dashboard.render.com
   - Sign in or create an account

2. **Create a New Web Service**
   - Click "New +" button
   - Select "Web Service"

3. **Connect Your Repository**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository
   - Select the branch (usually `main` or `master`)

4. **Configure the Service**
   ```
   Name: ong-trucking-frontend (or your preferred name)
   Root Directory: frontend
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Plan: Free (or your preferred plan)
   ```

5. **Add Environment Variables**
   - Click "Advanced" or go to "Environment" tab
   - Add the following environment variable:
     ```
     NEXT_PUBLIC_API_URL = https://your-backend-url.onrender.com
     ```
   - Replace `your-backend-url.onrender.com` with your actual backend URL

6. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Wait for the deployment to complete (usually takes 5-10 minutes)

7. **Access Your Application**
   - Once deployed, Render will provide you with a URL like:
     `https://ong-trucking-frontend.onrender.com`
   - Visit this URL to see your live application

### Method 2: Using render.yaml (Infrastructure as Code)

1. **Commit the render.yaml file**
   - The `render.yaml` file is already in your `frontend/` directory
   - Make sure it's committed to your repository

2. **Create a Blueprint**
   - In Render dashboard, click "New +" button
   - Select "Blueprint"
   - Connect your repository
   - Set the `frontend` directory as the root
   - Render will automatically detect the `render.yaml` file

3. **Configure Environment Variables**
   - Add the `NEXT_PUBLIC_API_URL` environment variable in the Blueprint settings

4. **Deploy**
   - Click "Apply" to deploy

## Important Configuration Notes

### Environment Variables

The application requires the following environment variable:

- **NEXT_PUBLIC_API_URL**: The URL of your backend API
  - Example: `https://gno-backend.onrender.com`
  - This MUST start with `NEXT_PUBLIC_` to be accessible in the browser
  - Do NOT include a trailing slash

### Backend CORS Configuration

Make sure your Django backend is configured to allow requests from your frontend domain:

In `backend/ong_backend/ong_backend/settings.py` or `settings_production.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-url.onrender.com",
    "http://localhost:3000",  # for local development
]

CSRF_TRUSTED_ORIGINS = [
    "https://your-frontend-url.onrender.com",
]
```

## Post-Deployment

### 1. Verify the Deployment
- Visit your deployed URL
- Check that the application loads correctly
- Test the API connections (upload, accounts, trips, etc.)

### 2. Set Up Auto-Deploy (Optional)
- In Render dashboard, go to your service settings
- Enable "Auto-Deploy" to automatically deploy when you push to your branch

### 3. Monitor Your Application
- Check the Render dashboard for logs
- Monitor for any errors or issues

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

### API Connection Errors
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check that the backend is running and accessible
- Verify CORS settings in the backend
- Check browser console for specific error messages

### Application Not Loading
- Check the deployment logs
- Ensure the start command is correct: `npm start`
- Verify the build completed successfully

### Environment Variables Not Working
- Remember: only variables starting with `NEXT_PUBLIC_` are accessible in the browser
- After changing environment variables, you must redeploy the application
- Clear browser cache and try again

## Free Tier Limitations

Render's free tier has some limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours of free usage per month

To keep your service always on, consider upgrading to a paid plan.

## Manual Deploy Commands (if needed)

If you need to trigger a manual deploy:

1. Go to your service in Render dashboard
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

## Updating the Application

To deploy updates:

1. Make changes to your code
2. Commit and push to your repository
3. Render will automatically deploy (if auto-deploy is enabled)
4. Or manually trigger a deploy from the dashboard

## Support

- Render Documentation: https://render.com/docs
- Next.js Documentation: https://nextjs.org/docs

## Production Checklist

- [ ] Backend API is deployed and running
- [ ] `NEXT_PUBLIC_API_URL` environment variable is set
- [ ] Backend CORS is configured for frontend domain
- [ ] Application builds successfully
- [ ] All pages load correctly
- [ ] API endpoints are accessible
- [ ] Forms and uploads work correctly
- [ ] Navigation between pages works
- [ ] Data displays correctly

