# Render Deployment Guide

## Environment Variables to Set in Render

### Required Variables (Aiven MySQL):

You have two options:

#### Option 1: Set DATABASE_URL directly (Recommended)
```
DATABASE_URL=mysql://avnadmin:AVNS_QkfL2UuF6FN8fzJOv_p@hazem-hazemosama2553-256a.b.aivencloud.com:11706/defaultdb?ssl-mode=REQUIRED
```

#### Option 2: Set individual variables
```
DB_HOST=hazem-hazemosama2553-256a.b.aivencloud.com
DB_PORT=11706
DB_USER=avnadmin
DB_PASSWORD=AVNS_QkfL2UuF6FN8fzJOv_p
DB_DATABASE=defaultdb
DB_SSL_CA_CERT=<your-ssl-certificate-if-needed>
```

### Other Required Variables:
```
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

## How to Set Environment Variables in Render:

1. **Go to your Render Dashboard**
   - Navigate to https://dashboard.render.com
   - Select your `egseekers-backend` service

2. **Open Environment Variables**
   - Click on "Environment" in the left sidebar
   - Or click on your service → "Environment" tab

3. **Update DATABASE_URL**
   - **IMPORTANT**: If you see `DATABASE_URL` set to `mysql://root:8490@localhost:3306/egseekers` or any localhost value, you MUST update it!
   - Either:
     - **Update** the existing `DATABASE_URL` to: `mysql://avnadmin:AVNS_QkfL2UuF6FN8fzJOv_p@hazem-hazemosama2553-256a.b.aivencloud.com:11706/defaultdb?ssl-mode=REQUIRED`
     - **OR Delete** `DATABASE_URL` and set the individual `DB_*` variables instead

4. **Save Changes**
   - Click "Save Changes"
   - Render will automatically redeploy your service

## Deployment Steps:

1. **Connect GitHub Repository**
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` directory as the root directory

2. **Set Environment Variables**
   - Go to your service → Environment tab
   - Add all required variables above
   - **CRITICAL**: Make sure `DATABASE_URL` is NOT set to localhost!

3. **Configure Build Settings**
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Environment: `Node`
   - **Note**: The build command will automatically run migrations on each deploy

4. **Deploy**
   - Render will automatically build and deploy
   - Check logs for any errors
   - The migrations will run automatically during the build process

5. **Run Database Migration Manually** (if needed)
   - If you see errors like "The table `User` does not exist", you need to run migrations manually
   - Go to your service → Shell (or use Render's Shell feature)
   - Run: `npx prisma migrate deploy`
   - This will apply all pending migrations to your database

## Troubleshooting:

### Error: "DATABASE_URL points to localhost"
- **Solution**: Update `DATABASE_URL` in Render's Environment variables to your Aiven database connection string
- Make sure the host is `hazem-hazemosama2553-256a.b.aivencloud.com`, NOT `localhost`

### Error: "Can't reach database server"
- Check that your Aiven database is running
- Verify the connection string is correct
- Make sure the database allows connections from Render's IP addresses

### Error: "SSL connection required"
- Make sure `?ssl-mode=REQUIRED` is included in your DATABASE_URL
- Or set `DB_SSL_CA_CERT` if your database requires a specific certificate

### Error: "The table `User` does not exist" or "P2021"
- **Solution**: The database migrations haven't been run yet
- **Option 1**: Wait for the next deployment - migrations run automatically during build
- **Option 2**: Run migrations manually:
  1. Go to your Render service → Shell
  2. Run: `npx prisma migrate deploy`
  3. This will create all necessary tables in your database
- **Option 3**: If migrations fail, you can use `npx prisma db push` as a fallback (not recommended for production)

## Health Check:
- Render will check `/api/health` endpoint
- Should return 200 status with health information

