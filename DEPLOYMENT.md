# Deployment Guide for Render

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Database**: You'll need a PostgreSQL database (Render provides this)

## Environment Variables to Set in Render

Set these in your Render service dashboard:

```
SECRET_KEY=your-django-secret-key-here
```

**Note**: 
- Using SQLite database (no database environment variables needed)
- CORS is configured for localhost development (update when you deploy frontend)

## Deployment Steps

1. **Connect GitHub Repository**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn ong_backend.wsgi:application`
   - **Python Version**: 3.11.0

3. **Set Environment Variables**
   - Add all the environment variables listed above
   - Make sure to use production settings

4. **Database Setup**
   - Using SQLite database (no additional setup required)
   - Database file will be created automatically during deployment

## File Structure

Make sure your backend folder structure looks like this:

```
backend/ong_backend/
├── manage.py
├── requirements.txt
├── Procfile
├── build.sh
├── runtime.txt
├── ong_backend/
│   ├── settings.py
│   ├── settings_production.py
│   ├── urls.py
│   └── wsgi.py
└── app/
    ├── models.py
    ├── views.py
    ├── urls.py
    └── ...
```

## Important Notes

- The build script will automatically run migrations and collect static files
- Make sure your frontend CORS settings match your deployed frontend URL
- Update your frontend API calls to use your Render backend URL
- Test your deployment thoroughly before going live
