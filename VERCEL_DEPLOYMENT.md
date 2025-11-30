# Deploying to Vercel

## Quick Setup

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin master
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add Environment Variables**:
   In Vercel dashboard → Project Settings → Environment Variables, add:
   - `NEXTAUTH_URL` = `https://beavertr.app` (or your custom domain)
   - `NEXTAUTH_SECRET` = (your secret from .env.local)
   - `DATABASE_URL` = (for production, you'll need a hosted database)
   - `GOOGLE_CLIENT_ID` = (from .env.local)
   - `GOOGLE_CLIENT_SECRET` = (from .env.local)
   - `TWITCH_CLIENT_ID` = (if using)
   - `TWITCH_CLIENT_SECRET` = (if using)
   - `STEAM_API_KEY` = (if using)

4. **Database Setup**:
   - For production, you'll need a hosted SQLite or PostgreSQL database
   - Vercel doesn't support SQLite file storage, so consider:
     - Turso (SQLite in the cloud)
     - Vercel Postgres
     - Supabase
   - Update `DATABASE_URL` in Vercel environment variables

5. **Deploy**:
   - Vercel will automatically deploy on every push to your main branch
   - First deployment happens when you import the project

## Important Notes

- **Database**: SQLite files don't persist on Vercel. You need a cloud database for production.
- **Environment Variables**: Never commit `.env.local` - add all variables in Vercel dashboard
- **Custom Domain**: Add your domain in Vercel project settings → Domains
- **Build Command**: Vercel auto-detects `npm run build` for Next.js

## Troubleshooting

- If build fails, check Vercel build logs
- Make sure all environment variables are set
- Database migrations may need to run on first deploy

