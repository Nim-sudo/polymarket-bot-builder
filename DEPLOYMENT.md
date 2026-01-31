# Deployment Guide

This guide covers deploying the PolyBot Builder landing page to various hosting platforms.

## Quick Deploy Options

### GitHub Pages (Recommended for Static Sites)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit: PolyBot Builder landing page"
   git branch -M main
   git remote add origin https://github.com/yourusername/polymarket-bot-builder.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Click Save

3. **Custom Domain (Optional)**
   - Add CNAME file with your domain
   - Configure DNS:
     - Type: CNAME
     - Name: www
     - Value: yourusername.github.io
   - Enable "Enforce HTTPS"

### Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd polymarket-bot-builder
   vercel
   ```

3. **Production Deploy**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy
   ```

2. **Or use Drag & Drop**
   - Visit [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag your project folder
   - Site goes live immediately

### AWS S3 + CloudFront

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://polybotbuilder.com
   ```

2. **Upload Files**
   ```bash
   aws s3 sync . s3://polybotbuilder.com --exclude ".git/*"
   ```

3. **Enable Static Hosting**
   - S3 Console > Bucket > Properties > Static website hosting
   - Index document: index.html

4. **CloudFront Distribution**
   - Create distribution pointing to S3 bucket
   - Configure custom domain and SSL certificate

## Custom Domain Setup

### DNS Configuration

For most providers (Namecheap, GoDaddy, Cloudflare):

```
Type    Name    Value                          TTL
A       @       185.199.108.153               3600
A       @       185.199.109.153               3600
A       @       185.199.110.153               3600
A       @       185.199.111.153               3600
CNAME   www     yourusername.github.io        3600
```

### SSL/HTTPS

- **GitHub Pages**: Automatic with Let's Encrypt
- **Vercel**: Automatic SSL
- **Netlify**: Automatic SSL
- **CloudFront**: Use ACM (AWS Certificate Manager)

## Environment-Specific Configuration

### Development
```bash
# Local server
python -m http.server 8000
# or
npx serve
```

### Staging
- Use a separate branch or subdomain
- Example: staging.polybotbuilder.com

### Production
- Always use HTTPS
- Enable CDN for performance
- Set up monitoring (Google Analytics, Sentry)

## Performance Optimization

### Before Deploy

1. **Minify CSS/JS** (Optional for small sites)
   ```bash
   npx minify styles.css > styles.min.css
   npx minify script.js > script.min.js
   ```

2. **Optimize Images**
   - Use WebP format
   - Compress with TinyPNG or ImageOptim
   - Lazy load images

3. **Enable Compression**
   - Most platforms enable gzip/brotli automatically
   - Verify with PageSpeed Insights

### CDN Configuration

Recommended CDN providers:
- Cloudflare (Free tier available)
- AWS CloudFront
- Fastly
- Vercel Edge Network (included)

## Monitoring & Analytics

### Google Analytics

Add to `<head>` in index.html:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Monitoring Tools
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Google PageSpeed Insights, WebPageTest
- **Errors**: Sentry (for JavaScript errors)

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## Troubleshooting

### Common Issues

1. **404 on GitHub Pages**
   - Wait 5-10 minutes after enabling
   - Check branch and folder settings
   - Verify index.html is in root

2. **CSS/JS Not Loading**
   - Use relative paths, not absolute
   - Check browser console for errors
   - Verify file names and paths

3. **Custom Domain Not Working**
   - DNS propagation can take 24-48 hours
   - Verify CNAME file in repository root
   - Check DNS configuration with `dig` or `nslookup`

4. **HTTPS Certificate Error**
   - Wait for Let's Encrypt provisioning (can take hours)
   - Ensure DNS is correctly configured
   - Try disabling/re-enabling HTTPS

## Security Best Practices

1. **Content Security Policy**
   Add to HTML `<head>`:
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;">
   ```

2. **HTTPS Only**
   - Always enforce HTTPS
   - Set up redirect from HTTP to HTTPS

3. **Security Headers**
   Configure on your hosting platform:
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy: strict-origin-when-cross-origin

## Rollback Procedure

### GitHub Pages
```bash
git revert HEAD
git push
```

### Vercel/Netlify
- Use their web dashboard to rollback to previous deployment
- Or redeploy a specific commit

## Support

For deployment issues:
- Check platform-specific documentation
- Review console logs for errors
- Test locally first with `python -m http.server` or `npx serve`

---

**Ready to deploy?** Start with GitHub Pages for the simplest setup.
