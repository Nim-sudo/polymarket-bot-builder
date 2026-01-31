# Deployment Instructions

## Deploying to Vercel

### 1. Set up your API key in Vercel Dashboard

1. Go to your project on vercel.com
2. Navigate to **Settings > Environment Variables**
3. Add a new variable:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: Your Claude API key (the one you provided)
   - **Environment**: Select Production, Preview, and Development
4. Click "Save"

### 2. Deploy

```bash
vercel --prod
```

## Local Development

### 1. Create .env.local file

Create a file named `.env.local` in the project root and add:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 2. Install Vercel CLI and run:

```bash
npm install -g vercel
vercel dev
```

## Security Notes

✅ Your API key is stored securely in Vercel environment variables
✅ It's NEVER exposed to client-side code  
✅ All API calls go through your serverless function at `/api/claude`
✅ Users cannot see or access your API key

## What Changed

- Removed API key prompts from the UI
- Created `/api/claude` serverless function
- API key is now stored on the server (Vercel env variable)
- Users use YOUR AI, not their own API keys
