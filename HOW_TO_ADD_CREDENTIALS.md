# How to Add Twitch & Steam Credentials

## ⚠️ IMPORTANT: You Must Edit the `.env.local` File Directly

There is **NO UI** to add credentials. You need to manually edit the `.env.local` file in your code editor.

## Step-by-Step Instructions

### Step 1: Open `.env.local` File

1. In your code editor (VS Code, etc.), open the file: `.env.local`
2. It should be in the root of your project: `E:\beavertrAPP\Nov25\website\.env.local`

### Step 2: Get Your Twitch Credentials

1. Go to: https://dev.twitch.tv/console
2. Log in with your Twitch account
3. Click **"Register Your Application"**
4. Fill in:
   - **Name:** `beavertr.app`
   - **OAuth Redirect URLs:** `http://localhost:3000/api/auth/callback/twitch`
   - **Category:** Website Integration
5. Click **"Create"**
6. You'll see:
   - **Client ID** (looks like: `abc123xyz...`)
   - **Client Secret** (click "New Secret" if needed, looks like: `def456uvw...`)
7. **Copy both values**

### Step 3: Get Your Steam API Key (Optional)

1. Go to: https://steamcommunity.com/dev/apikey
2. Log in with Steam
3. Enter domain: `beavertr.app` (or `localhost`)
4. Click **"Register"**
5. Copy the **API Key**

### Step 4: Add to `.env.local`

Open `.env.local` and add these lines (replace with your actual values):

```env
# Add these lines to your .env.local file:

TWITCH_CLIENT_ID="paste-your-twitch-client-id-here"
TWITCH_CLIENT_SECRET="paste-your-twitch-client-secret-here"
STEAM_API_KEY="paste-your-steam-api-key-here"
```

**Example of what it should look like:**

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-existing-secret"
GOOGLE_CLIENT_ID="your-existing-google-id"
GOOGLE_CLIENT_SECRET="your-existing-google-secret"

# NEW LINES - ADD THESE:
TWITCH_CLIENT_ID="abc123xyz456"
TWITCH_CLIENT_SECRET="def789uvw012"
STEAM_API_KEY="XYZ123ABC456"
```

### Step 5: Save and Restart

1. **Save** the `.env.local` file
2. **Stop** your dev server (press `Ctrl+C` in terminal)
3. **Restart** it:
   ```bash
   npm run dev
   ```

### Step 6: Verify It Works

After restarting, check your terminal. You should see:
```
Twitch provider added
Steam provider added
```

Instead of:
```
Twitch provider skipped - missing credentials
Steam provider skipped - missing API key
```

Then try clicking the Twitch/Steam buttons in the sign-in modal - they should work!

## Troubleshooting

### "File not found" or "Can't find .env.local"
- The file might not exist yet
- Create it in the root folder: `E:\beavertrAPP\Nov25\website\.env.local`
- Copy the example content from `README.md`

### "Still says 'skipped' after adding credentials"
- Make sure there are **NO SPACES** around the `=` sign
- Make sure the values are in **QUOTES** (double quotes)
- Make sure you **saved** the file
- Make sure you **restarted** the server

### "Sign in button does nothing"
- Check browser console for errors
- Make sure the redirect URI in Twitch console matches exactly: `http://localhost:3000/api/auth/callback/twitch`
- Make sure `NEXTAUTH_URL` in `.env.local` is set to `http://localhost:3000`

## Quick Checklist

- [ ] Opened `.env.local` file in code editor
- [ ] Got Twitch Client ID from https://dev.twitch.tv/console
- [ ] Got Twitch Client Secret from https://dev.twitch.tv/console
- [ ] Got Steam API Key from https://steamcommunity.com/dev/apikey (optional)
- [ ] Added all three lines to `.env.local` with actual values
- [ ] Saved the file
- [ ] Stopped dev server (Ctrl+C)
- [ ] Restarted dev server (`npm run dev`)
- [ ] Checked terminal for "Twitch provider added" and "Steam provider added"
- [ ] Tested sign-in buttons

