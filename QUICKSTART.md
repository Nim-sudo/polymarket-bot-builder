# Quick Start Guide

Get your PolyBot Builder landing page live in minutes.

## View Locally

### Option 1: Python HTTP Server (Simplest)
```bash
cd polymarket-bot-builder
python -m http.server 8000
```
Visit: `http://localhost:8000`

### Option 2: Node.js Serve
```bash
npx serve
```

### Option 3: Just Open It
Double-click `index.html` to open in your browser (some features may not work)

## Deploy to GitHub Pages

### Step 1: Create GitHub Repository
```bash
# On GitHub.com:
# 1. Click "New Repository"
# 2. Name it "polymarket-bot-builder"
# 3. Keep it public
# 4. Don't initialize with README (we already have one)
```

### Step 2: Push Code
```bash
cd polymarket-bot-builder
git remote add origin https://github.com/YOUR_USERNAME/polymarket-bot-builder.git
git push -u origin master
```

### Step 3: Enable GitHub Pages
1. Go to repository Settings
2. Click "Pages" in left sidebar
3. Under "Source", select branch: `master`, folder: `/ (root)`
4. Click "Save"
5. Wait 2-3 minutes
6. Your site will be live at: `https://YOUR_USERNAME.github.io/polymarket-bot-builder/`

## Deploy to Vercel (Alternative)

```bash
npm i -g vercel
cd polymarket-bot-builder
vercel
```

Follow the prompts. Site will be live in seconds!

## Deploy to Netlify (Alternative)

1. Visit [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `polymarket-bot-builder` folder
3. Site goes live immediately!

## Customize

### Change Colors
Edit `styles.css` - look for CSS variables at the top:
```css
:root {
    --accent-primary: #00FFA3;  /* Change to your brand color */
    --accent-secondary: #00B8D4;
}
```

### Update Content
Edit `index.html`:
- Pricing: Search for `$30` and update
- Features: Look for `features-grid` section
- FAQ: Find `faq-grid` section

### Add Your Logo
Replace the SVG logo in:
- Navigation (line ~18)
- Footer (line ~400+)

### Configure Analytics
Add Google Analytics ID to `index.html` (instructions in DEPLOYMENT.md)

## Next Steps

1. **Buy a Custom Domain**
   - Namecheap, GoDaddy, or Google Domains
   - Point DNS to GitHub Pages or Vercel

2. **Set Up Email**
   - Replace `support@polybotbuilder.com` with your real email
   - Consider using: Google Workspace, Zoho Mail, or ProtonMail

3. **Add Payment Integration**
   - Stripe for subscriptions
   - Paddle for global payments
   - Lemon Squeezy for simplicity

4. **Build the Actual Platform**
   - Start with Next.js or React
   - Integrate OpenAI API for code generation
   - Connect to Polymarket CLOB API
   - Add user authentication (Clerk, Auth0, or Supabase)

5. **Launch Marketing**
   - Share on Twitter/X
   - Post on Reddit (r/Polymarket, r/algotrading)
   - Product Hunt launch
   - Crypto Discord communities

## Troubleshooting

### "404 Not Found" on GitHub Pages
- Wait 5-10 minutes after enabling
- Check Settings > Pages is properly configured
- Verify branch name is correct

### Styles Not Loading
- Check browser console for errors
- Verify all file paths are relative
- Clear browser cache (Ctrl+Shift+R)

### JavaScript Not Working
- Open browser console (F12)
- Check for errors
- Verify `script.js` is in same directory as `index.html`

## Support

Questions? Issues?
- Check the [README.md](README.md) for detailed documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment specifics
- Read [RESEARCH.md](RESEARCH.md) for Polymarket API details

## Ready to Launch?

```bash
# Quick deployment checklist:
cd polymarket-bot-builder
git add .
git commit -m "Update branding and content"
git push

# If deploying to Vercel:
vercel --prod
```

Your Polymarket bot builder landing page is ready to go! 🚀
