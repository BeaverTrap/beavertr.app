# beavertr.app

Portfolio site for art, web design, and coding projects.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"
STEAM_API_KEY="your-steam-api-key"
```

3. Set up OAuth providers:

   **Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     * Choose "External" user type (unless you have a Google Workspace)
     * Fill in the required app information (name, email, etc.)
     * Add your email to test users if needed
   - For Application type, select "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Click "Create" and copy the Client ID and Client Secret
   - Paste them into your `.env.local` file

   **Twitch OAuth:**
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console)
   - Log in with your Twitch account
   - Click "Register Your Application"
   - Fill in:
     * **Name:** Your application name (e.g., `beavertr.app`)
     * **OAuth Redirect URLs:** `http://localhost:3000/api/auth/callback/twitch`
       - For production, also add: `https://beavertr.app/api/auth/callback/twitch`
     * **Category:** Select "Website Integration" or "Other"
   - Click "Create" and copy the Client ID and Client Secret
   - Paste them into your `.env.local` file as `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`

   **Steam OpenID (Optional but Recommended):**
   - Go to [Steam Web API Key](https://steamcommunity.com/dev/apikey)
   - Sign in with your Steam account
   - Enter a domain name (e.g., `beavertr.app` or `localhost`)
   - Click "Register" and copy the API key
   - Paste it into your `.env.local` file as `STEAM_API_KEY`
   - **Note:** Steam login will work without the API key, but user profile info (name, avatar) won't be fetched

4. Generate a NextAuth secret:
```bash
openssl rand -base64 32
```
Or use any random string generator.

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## Features

- Multiple OAuth providers (Google, Twitch, Steam)
- User-specific wishlist with database persistence
- Social features (friends, moderators, anonymous purchases)
- Art portfolio section
- Project showcase
