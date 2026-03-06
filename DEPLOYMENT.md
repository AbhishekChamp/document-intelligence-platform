# DocuIntel - Deployment Guide

This guide covers deploying DocuIntel to Netlify.

---

## 🚀 Quick Deploy Options

### Option 1: One-Click Deploy (Recommended)

Click the button below to deploy directly to Netlify:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/AbhishekChamp/document-intelligence-platform)

**Note:** After deployment, you'll need to update the Netlify badge URL in README.md with your actual site ID.

---

### Option 2: Deploy from GitHub

1. **Fork/Clone this repository** to your GitHub account

2. **Go to Netlify Dashboard**
   - Visit [https://app.netlify.com/](https://app.netlify.com/)
   - Sign in (or sign up with GitHub)

3. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" as your Git provider
   - Authorize Netlify to access your repositories

4. **Select Repository**
   - Find and select `document-intelligence-platform`

5. **Configure Build Settings**

   These settings are auto-detected from `netlify.toml`, but verify:

   | Setting           | Value                |
   | ----------------- | -------------------- |
   | Base directory    | `/` (or leave blank) |
   | Build command     | `pnpm build`         |
   | Publish directory | `dist`               |

6. **Set Environment Variables** (optional)

   ```
   NODE_VERSION = 20
   NPM_FLAGS = --version
   ```

7. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically

---

### Option 3: Deploy with Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site (in project root)
netlify init
# Follow prompts to create/link site

# Build the project
pnpm build

# Deploy to production
netlify deploy --prod --dir=dist

# Or deploy a preview (draft)
netlify deploy --dir=dist
```

---

## ⚙️ Configuration Details

### netlify.toml

The `netlify.toml` file in the project root contains all deployment configurations:

```toml
[build]
  publish = "dist"
  command = "pnpm build"

[build.environment]
  NODE_VERSION = "20"
```

### Key Features Configured

✅ **SPA Routing** — All routes redirect to `index.html` for client-side routing  
✅ **Security Headers** — CSP, HSTS, X-Frame-Options, etc.  
✅ **Asset Caching** — Long-term caching for versioned assets  
✅ **HTTPS Enforcement** — Automatic HTTP to HTTPS redirects  
✅ **Build Optimization** — CSS/JS bundling and minification

---

## 🔧 Post-Deployment Setup

### 1. Update Site Name

1. Go to **Site settings** → **Site details**
2. Click "Change site name"
3. Choose a custom subdomain (e.g., `docuintel-yourname.netlify.app`)

### 2. Add Custom Domain (Optional)

1. Go to **Domain settings** → **Custom domains**
2. Click "Add custom domain"
3. Enter your domain and follow DNS configuration instructions

### 3. Enable Branch Deploys (Optional)

1. Go to **Site settings** → **Build & deploy** → **Continuous deployment**
2. Configure branch deploy settings:
   - Production branch: `main` (or `master`)
   - Deploy previews: Enable for all pull requests
   - Branch deploys: Enable for specific branches

### 4. Configure Form Notifications (Optional)

If you add contact forms in the future:

1. Go to **Forms** in the site dashboard
2. Enable form detection
3. Add notification recipients

---

## 🧪 Testing Your Deployment

After deployment, verify the following:

### Basic Functionality

- [ ] Homepage loads correctly
- [ ] Navigation works (Dashboard, History, Settings, About)
- [ ] Dark mode toggle works
- [ ] File upload accepts documents
- [ ] Analysis completes successfully
- [ ] History is saved (IndexedDB working)

### Security

- [ ] HTTPS is enforced (try accessing HTTP version - should redirect)
- [ ] No CSP violations in browser console
- [ ] Service worker registered (DevTools → Application → Service Workers)

### Performance

- [ ] Lighthouse score > 70 for Performance
- [ ] Lighthouse score > 90 for Accessibility
- [ ] Assets are cached (check Network tab in DevTools)

---

## 🔄 Continuous Deployment

Netlify automatically deploys when you push to your repository:

### Production Deploys

- Triggered by pushes to `main` (or your configured production branch)
- Example:
  ```bash
  git push origin main
  ```

### Deploy Previews

- Automatically created for Pull Requests
- Allows testing changes before merging

### Branch Deploys

- Enable in site settings to deploy other branches
- Useful for staging environments

---

## 📊 Monitoring & Analytics

### Netlify Analytics

1. Go to **Analytics** tab in your site dashboard
2. Enable analytics (may require paid plan)
3. View traffic, performance, and error metrics

### Lighthouse Plugin

The project includes `@netlify/plugin-lighthouse` in `netlify.toml`:

```toml
[[plugins]]
  package = "@netlify/plugin-lighthouse"

  [plugins.inputs.thresholds]
    performance = 0.7
    accessibility = 0.9
    best-practices = 0.8
    seo = 0.8
```

Lighthouse runs on every deploy and fails the build if thresholds aren't met.

---

## 🛠️ Troubleshooting

### Build Failures

**Problem:** Build fails with "pnpm not found"

**Solution:** Netlify auto-detects pnpm, but if issues occur:

1. Set `NODE_VERSION = 20` in environment variables
2. Add `NPM_FLAGS = --version` to force npm detection

---

**Problem:** "Build command not found"

**Solution:** Verify `netlify.toml` is in the repository root with:

```toml
[build]
  command = "pnpm build"
```

---

### Runtime Issues

**Problem:** 404 errors on page refresh

**Solution:** Check that `_redirects` file is in `public/` folder with:

```
/* /index.html 200
```

---

**Problem:** CSP errors in browser console

**Solution:** Update `netlify.toml` headers section to match your needs:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; ..."
```

---

**Problem:** Service Worker not updating

**Solution:** The service worker cache is configured to not cache in development. For production:

1. Check `public/sw.js` cache version
2. Increment version when making changes
3. Or unregister service worker in browser DevTools

---

### Performance Issues

**Problem:** Slow initial load

**Solutions:**

1. Check bundle size: `pnpm build` shows chunk sizes
2. Enable asset optimization in Netlify: **Site settings** → **Asset optimization**
3. Consider code-splitting additional routes

---

## 📝 Environment Variables Reference

| Variable           | Description                   | Required | Default           |
| ------------------ | ----------------------------- | -------- | ----------------- |
| `NODE_VERSION`     | Node.js version               | No       | 20                |
| `NODE_ENV`         | Environment mode              | No       | production        |
| `VITE_APP_VERSION` | App version injected at build | No       | from package.json |

---

## 🌐 Domain Configuration

### Netlify Subdomain

Default: `https://docuintel-xxx.netlify.app`

### Custom Domain

1. **Add domain in Netlify:**
   - Site settings → Domain management → Add custom domain

2. **Configure DNS:**

   **Option A: Netlify DNS (Recommended)**
   - Change nameservers to Netlify's:
     ```
     dns1.p01.nsone.net
     dns2.p01.nsone.net
     dns3.p01.nsone.net
     dns4.p01.nsone.net
     ```

   **Option B: External DNS (CNAME)**
   - Add CNAME record:
     ```
     www  CNAME  docuintel-xxx.netlify.app
     ```
   - Add A record for apex domain:
     ```
     @  A  75.2.60.5
     ```

3. **Enable HTTPS:**
   - Netlify automatically provisions SSL certificates via Let's Encrypt
   - Force HTTPS in Domain settings

---

## 🗑️ Rollback Deployment

If you need to rollback to a previous version:

1. Go to **Deploys** tab in Netlify dashboard
2. Find the previous working deploy
3. Click "Publish deploy"

Or via CLI:

```bash
netlify deploys:list
netlify deploys:publish <deploy-id>
```

---

## 📞 Support

For deployment issues:

- **Netlify Docs:** [https://docs.netlify.com/](https://docs.netlify.com/)
- **Netlify Support:** [https://www.netlify.com/support/](https://www.netlify.com/support/)
- **Project Issues:** [GitHub Issues](https://github.com/AbhishekChamp/document-intelligence-platform/issues)

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests pass (`pnpm test:run`)
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm tsc --noEmit`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] Build output is in `dist/` directory
- [ ] `netlify.toml` is configured correctly
- [ ] `public/_redirects` exists for SPA routing
- [ ] README badges updated with correct URLs
- [ ] About Page deployment info updated

---

**Happy Deploying! 🚀**
