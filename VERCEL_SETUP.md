# Vercel Deployment Setup Guide

## Before You Deploy

### 1. Environment Variables

In the Vercel project setup screen, expand **"Environment Variables"** and add the following:

#### Required Variables:
- `NEXTAUTH_URL` = `https://your-app.vercel.app` (or your custom domain after setup)
- `NEXTAUTH_SECRET` = (copy from your `.env.local` file)
- `DATABASE_URL` = (see Database Setup section below)

#### OAuth Provider Variables:
- `GOOGLE_CLIENT_ID` = (copy from your `.env.local`)
- `GOOGLE_CLIENT_SECRET` = (copy from your `.env.local`)
- `TWITCH_CLIENT_ID` = (copy from your `.env.local` if using)
- `TWITCH_CLIENT_SECRET` = (copy from your `.env.local` if using)
- `STEAM_API_KEY` = (copy from your `.env.local` if using)

**Important:** Never commit your `.env.local` file to Git. Only add these values in the Vercel dashboard.

---

## Database Setup (CRITICAL)

**SQLite files don't work on Vercel** because the file system is read-only. You need a cloud database.

### Option 1: Turso (Recommended - Easiest Migration)

Turso provides SQLite in the cloud, so you can keep using the same database structure.

1. **Sign up at [turso.tech](https://turso.tech)**
2. **Create a new database:**
   - Click "Create Database"
   - Name it `beavertr-app` (or your preferred name)
   - Choose a location close to your users
3. **Get your connection string:**
   - Go to your database dashboard
   - Click "Connect" or "Connection Details"
   - Copy the `DATABASE_URL` (it will look like: `libsql://your-db-name-xxxxx.turso.io`)
   - **Get your auth token:** Click "Create Token" button in the Connect section to generate an authentication token
4. **Add to Vercel:**
   - In Vercel Environment Variables, add:
     - `DATABASE_URL` = `libsql://beavertr-app-beavertrap.aws-us-west-2.turso.io`
     - `TURSO_AUTH_TOKEN` = (paste the token you created in step 3 - keep this secure and never commit it to Git)
   
   **Your Database URL:** `libsql://beavertr-app-beavertrap.aws-us-west-2.turso.io`
   
   **Note:** Your auth token should be kept secure. Copy it from the Turso dashboard when setting up Vercel environment variables.

**Turso CLI (Optional):**
```bash
# Install Turso CLI
npm install -g @libsql/client

# Create database
turso db create beavertr-app

# Get connection string
turso db show beavertr-app
```

### Option 2: Vercel Postgres

1. **In Vercel dashboard:**
   - Go to your project
   - Click "Storage" tab
   - Click "Create Database" → "Postgres"
   - Follow the setup wizard
2. **Get connection string:**
   - Vercel will automatically create a `POSTGRES_URL` environment variable
   - You'll need to update your code to use Postgres instead of SQLite
   - Update `src/lib/db.ts` to use Postgres adapter

### Option 3: Supabase

1. **Sign up at [supabase.com](https://supabase.com)**
2. **Create a new project**
3. **Get connection string:**
   - Go to Project Settings → Database
   - Copy the connection string
4. **Add to Vercel:**
   - `DATABASE_URL` = (Supabase connection string)

---

## Deployment Steps

1. **Add Environment Variables** (see above)
2. **Set Database URL** (see Database Setup)
3. **Click "Deploy"** in Vercel
4. **Wait for build to complete** (usually 2-3 minutes)

---

## After Deployment

### 1. Update OAuth Redirect URIs

After deployment, Vercel will give you a URL like `https://beavertr-app.vercel.app`. Update your OAuth providers:

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to your OAuth credentials
3. Add authorized redirect URI:
   - `https://beavertr-app.vercel.app/api/auth/callback/google`
   - (Keep your localhost one for development)

#### Twitch OAuth:
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Edit your application
3. Add OAuth Redirect URL:
   - `https://beavertr-app.vercel.app/api/auth/callback/twitch`
   - (Keep your localhost one for development)

### 2. Update Environment Variables

After you get your Vercel URL, update:
- `NEXTAUTH_URL` = `https://beavertr-app.vercel.app` (or your custom domain)

### 3. Run Database Migrations

If using Turso or another cloud database, you may need to run migrations:

```bash
# For Turso (if using Turso CLI)
turso db shell beavertr-app < migrations.sql

# Or use Drizzle Kit
npm run db:push
```

**Note:** You may need to set up a GitHub Action or manual migration process for production.

---

## Custom Domain Setup

1. **In Vercel dashboard:**
   - Go to your project → Settings → Domains
   - Click "Add Domain"
   - Enter `beavertr.app` (or your domain)
2. **Update DNS:**
   - Follow Vercel's DNS instructions
   - Usually involves adding CNAME records
3. **Update Environment Variables:**
   - Change `NEXTAUTH_URL` to your custom domain
   - Update OAuth redirect URIs to use custom domain

---

## Troubleshooting

### Build Fails
- Check Vercel build logs for errors
- Make sure all environment variables are set
- Verify `DATABASE_URL` is correct

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check if database requires authentication tokens
- Ensure database is accessible from Vercel's IP ranges

### OAuth Not Working
- Verify redirect URIs match exactly (including https://)
- Check that `NEXTAUTH_URL` matches your deployment URL
- Ensure all OAuth credentials are correct

### Missing Environment Variables
- Go to Project Settings → Environment Variables
- Add any missing variables
- Redeploy after adding variables

---

## Development vs Production

- **Development:** Uses `.env.local` with SQLite file (`dev.db`)
- **Production:** Uses Vercel Environment Variables with cloud database

Keep both environments separate. Never commit `.env.local` to Git.

---

## Quick Checklist

- [ ] All environment variables added to Vercel
- [ ] Cloud database set up (Turso/Vercel Postgres/Supabase)
- [ ] `DATABASE_URL` added to Vercel
- [ ] OAuth redirect URIs updated with production URL
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Database migrations run (if needed)
- [ ] Custom domain configured (optional)
- [ ] Test login/signup after deployment

---

## Need Help?

- **Turso Docs:** https://docs.turso.tech
- **Vercel Docs:** https://vercel.com/docs
- **NextAuth.js Docs:** https://authjs.dev

