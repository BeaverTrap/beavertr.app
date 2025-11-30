# How to Initialize Turso Database Schema

Your Turso database needs to have the tables created before the app can work. Here's how to set it up:

## Quick Fix: Run This Command

**In PowerShell (Windows):**
```powershell
$env:DATABASE_URL="libsql://beavertr-app-beavertrap.aws-us-west-2.turso.io"
$env:TURSO_AUTH_TOKEN="your-token-here"
npm run db:push
```

**Or in Command Prompt:**
```cmd
set DATABASE_URL=libsql://beavertr-app-beavertrap.aws-us-west-2.turso.io
set TURSO_AUTH_TOKEN=your-token-here
npm run db:push
```

Replace `your-token-here` with your actual Turso auth token from Vercel environment variables.

## Option 1: Using Drizzle Kit (Recommended)

1. **Set environment variables locally** (temporarily for migration):
   Create a `.env.migrate` file or temporarily update your `.env.local`:
   ```env
   DATABASE_URL=libsql://beavertr-app-beavertrap.aws-us-west-2.turso.io
   TURSO_AUTH_TOKEN=your-token-here
   ```

2. **Run the migration**:
   ```bash
   npm run db:push
   ```

   This will create all the tables in your Turso database.

## Option 2: Using Turso CLI

If you have the Turso CLI installed:

```bash
# Install Turso CLI (if not already installed)
npm install -g @libsql/cli

# Login to Turso
turso auth login

# Run SQL commands directly
turso db shell beavertr-app-beavertrap < schema.sql
```

## Option 3: Manual SQL (Quick Fix)

You can run SQL directly in the Turso dashboard:

1. Go to your Turso dashboard
2. Select your database `beavertr-app`
3. Click on "SQL Editor" or "Query"
4. Run the schema creation SQL (you'll need to generate this from your schema.ts file)

## Verify Tables Were Created

After running migrations, verify in Turso dashboard that these tables exist:
- `users`
- `accounts`
- `sessions`
- `verificationTokens`
- `wishlists`
- `wishlistItems`
- `friendships`

## Important Notes

- **After running migrations, redeploy your Vercel app** so it picks up the database changes
- Make sure `DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel environment variables
- The migration only needs to run once - after that, your app will work

