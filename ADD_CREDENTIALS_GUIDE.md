# How to Add Twitch & Steam Credentials

## Quick Steps

### 1. Get Twitch Credentials
1. Go to: **https://dev.twitch.tv/console**
2. Log in with your Twitch account
3. Click **"Register Your Application"**
4. Fill in:
   - **Name:** `beavertr.app`
   - **OAuth Redirect URLs:** 
     - For development: `http://localhost:3000/api/auth/callback/twitch`
     - For production: `https://beavertr.app/api/auth/callback/twitch`
     - **Add BOTH URLs** (you can add multiple redirect URLs)
   - **Category:** Website Integration
5. Click **"Create"**
6. Copy your **Client ID** and **Client Secret**

### 2. Get Steam API Key
1. Go to: **https://steamcommunity.com/dev/apikey**
2. Log in with Steam
3. Enter domain: `beavertr.app` (for production)
   - Note: Steam doesn't require localhost for development, just the production domain
4. Click **"Register"**
5. Copy your **API Key**

### 3. Add to .env.local
Open `.env.local` in your code editor and add:

```env
TWITCH_CLIENT_ID="paste-your-twitch-client-id-here"
TWITCH_CLIENT_SECRET="paste-your-twitch-client-secret-here"
STEAM_API_KEY="paste-your-steam-api-key-here"
```

**Important:** Make sure `NEXTAUTH_URL` in your `.env.local` is set correctly:
- For development: `NEXTAUTH_URL=http://localhost:3000`
- For production: `NEXTAUTH_URL=https://beavertr.app`

### 4. Restart Server
Stop your dev server (Ctrl+C) and restart:
```bash
npm run dev
```

That's it! The "Connect" buttons will work after restarting.

## Production Deployment

When deploying to production:
1. Make sure your production `.env` has the same credentials
2. Ensure `NEXTAUTH_URL=https://beavertr.app` is set
3. Verify the redirect URLs in Twitch console match your production domain

