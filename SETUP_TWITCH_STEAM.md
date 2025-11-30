# Twitch & Steam OAuth Setup Guide

Follow these steps to enable Twitch and Steam login options.

## Step 1: Set Up Twitch OAuth

1. **Go to Twitch Developer Console**
   - Visit: https://dev.twitch.tv/console
   - Log in with your Twitch account

2. **Register Your Application**
   - Click "Register Your Application" button
   - Fill in the form:
     - **Name:** `beavertr.app` (or your app name)
     - **OAuth Redirect URLs:** 
       - For development: `http://localhost:3000/api/auth/callback/twitch`
       - For production: `https://beavertr.app/api/auth/callback/twitch` (add both if needed)
     - **Category:** Select "Website Integration" or "Other"
   - Click "Create"

3. **Get Your Credentials**
   - After creating, you'll see your **Client ID** and **Client Secret**
   - Copy both values

4. **Add to .env.local**
   ```env
   TWITCH_CLIENT_ID="your-twitch-client-id-here"
   TWITCH_CLIENT_SECRET="your-twitch-client-secret-here"
   ```

## Step 2: Set Up Steam OpenID (Optional but Recommended)

1. **Get Steam Web API Key**
   - Visit: https://steamcommunity.com/dev/apikey
   - Sign in with your Steam account
   - Enter a domain name (e.g., `beavertr.app` or `localhost`)
   - Click "Register"
   - Copy your **Steam Web API Key**

2. **Add to .env.local**
   ```env
   STEAM_API_KEY="your-steam-api-key-here"
   ```

   **Note:** Steam login will work without the API key, but user profile info (name, avatar) won't be fetched.

## Step 3: Update Your .env.local File

Open your `.env.local` file and add/update these lines:

```env
# Twitch OAuth
TWITCH_CLIENT_ID="your-twitch-client-id-here"
TWITCH_CLIENT_SECRET="your-twitch-client-secret-here"

# Steam OpenID (Optional)
STEAM_API_KEY="your-steam-api-key-here"
```

## Step 4: Restart Your Development Server

After adding the credentials:

1. Stop your current dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

3. Check the console - you should see:
   ```
   Twitch provider added
   Steam provider added
   ```

   Instead of:
   ```
   Twitch provider skipped - missing credentials
   Steam provider skipped - missing API key
   ```

## Troubleshooting

### Twitch Issues:
- **"Invalid redirect URI"**: Make sure the redirect URI in Twitch console exactly matches: `http://localhost:3000/api/auth/callback/twitch`
- **"Client ID not found"**: Double-check that `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are in your `.env.local` file
- Make sure there are no extra spaces or quotes around the values

### Steam Issues:
- **Steam login works but no profile info**: This is normal if you don't have a `STEAM_API_KEY`. Add the API key to get user names and avatars.
- **"Steam ID not found"**: This usually means the OpenID callback isn't working. Check that `NEXTAUTH_URL` is set correctly in `.env.local`

## Production Setup

When deploying to production:

1. **Update Twitch Redirect URI:**
   - Go back to Twitch Developer Console
   - Add your production URL: `https://beavertr.app/api/auth/callback/twitch`
   - Keep both localhost and production URLs if you want to test both

2. **Update Environment Variables:**
   - Set `NEXTAUTH_URL` to your production URL: `https://beavertr.app`
   - Make sure all credentials are set in your hosting platform's environment variables

## Quick Checklist

- [ ] Twitch application created at https://dev.twitch.tv/console
- [ ] Twitch Client ID copied
- [ ] Twitch Client Secret copied
- [ ] Twitch redirect URI set to: `http://localhost:3000/api/auth/callback/twitch`
- [ ] Steam API key obtained from https://steamcommunity.com/dev/apikey (optional)
- [ ] All credentials added to `.env.local`
- [ ] Development server restarted
- [ ] Console shows "Twitch provider added" and "Steam provider added"

