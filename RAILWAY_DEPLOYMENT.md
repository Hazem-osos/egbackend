# Railway Deployment Guide

## Environment Variables to Set in Railway

### Required Variables:
```
DATABASE_URL=mysql://avnadmin:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/egseekers?sslaccept=strict
NODE_ENV=production
PORT=10000
JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
FRONTEND_URL=https://your-frontend-url.com
```

### Optional Variables (if using these features):
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Deployment Steps:

1. **Connect GitHub Repository**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your backend repository

2. **Set Environment Variables**
   - Go to your service → Variables tab
   - Add all required variables above

3. **Deploy**
   - Railway will automatically build and deploy
   - Check logs for any errors

4. **Run Database Migration**
   - Go to your service → Deployments tab
   - Click on latest deployment → View Logs
   - Run: `npx prisma db push` in Railway console

## Build Process:
- Railway will run `npm ci` (install dependencies)
- Then `npx prisma generate` (generate Prisma client)
- Finally `npm start` (start the server)

## Health Check:
- Railway will check `/api/health` endpoint
- Should return 200 status with health information
