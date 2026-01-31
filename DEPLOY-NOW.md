# Deploy to GitHub Pages - Step by Step

## Quick Deployment Guide

Your code is ready and committed! Follow these steps to get it live.

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon (top right) → **"New repository"**
3. Settings:
   - **Repository name**: `polymarket-bot-builder` (or your preferred name)
   - **Description**: "Landing page for PolyBot Builder - Polymarket trading bot platform"
   - **Visibility**: Public (required for free GitHub Pages)
   - **Do NOT check** "Initialize with README" (we already have one)
4. Click **"Create repository"**

### Step 2: Push Your Code

GitHub will show you commands. Use these:

```bash
cd "C:\Users\enoch\polymarket-bot-builder"

# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/polymarket-bot-builder.git

# Rename branch to main (if needed)
git branch -M main

# Push the code
git push -u origin main
```

**Example:**
If your username is `johndoe`:
```bash
git remote add origin https://github.com/johndoe/polymarket-bot-builder.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** (top tab)
3. Scroll down and click **"Pages"** (left sidebar)
4. Under **"Source"**:
   - Branch: Select **`main`**
   - Folder: Select **`/ (root)`**
5. Click **"Save"**
6. Wait 2-5 minutes

### Step 4: Get Your Live URL

After a few minutes, refresh the Pages settings page. You'll see:

```
✅ Your site is live at https://YOUR_USERNAME.github.io/polymarket-bot-builder/
```

Click the link to view your live landing page!

## Optional: Custom Domain

### If You Own a Domain (e.g., polybotbuilder.com)

1. In GitHub Pages settings, add your custom domain
2. Configure your domain's DNS:

**For apex domain (polybotbuilder.com):**
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: YOUR_USERNAME.github.io
```

3. Wait 24-48 hours for DNS propagation
4. Enable HTTPS in GitHub Pages settings

## Troubleshooting

### "404 Not Found"
- Wait 5-10 minutes after enabling Pages
- Check branch name is `main` (not `master`)
- Verify folder is `/ (root)`
- Make sure repository is public

### "Site not updating"
```bash
# Make a small change and push
cd "C:\Users\enoch\polymarket-bot-builder"
git add .
git commit -m "Trigger rebuild"
git push
```

### "git push" asks for password
GitHub deprecated password authentication. Use:
1. **Personal Access Token**: Settings → Developer settings → Personal access tokens
2. **SSH Key**: More secure, one-time setup

Or install GitHub CLI:
```bash
winget install GitHub.cli
gh auth login
```

## Alternative: Deploy to Vercel (Faster)

If you prefer instant deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd "C:\Users\enoch\polymarket-bot-builder"
vercel

# Follow prompts (all defaults are fine)
```

Live in 30 seconds! Free custom domain included.

## What's Next?

Once deployed:
- [ ] Share the URL and get feedback
- [ ] Set up Google Analytics (optional)
- [ ] Configure custom domain (optional)
- [ ] Start building the actual platform

## Need Help?

Can't get it working? Common solutions:
- Make sure you're signed into GitHub
- Check repository is public
- Verify you have push access
- Try a different browser for GitHub settings

---

**Your code is ready to go live! Just follow the steps above.**
