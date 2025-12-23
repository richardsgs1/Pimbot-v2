# Backup & Restore Guide - PiMbOt v2

**Last Stable Backup:** December 22, 2025
**Git Tag:** `v1.1-stable-dec22`
**Status:** ✅ Fully Working & Deployed

---

## 🎯 Current Stable State

### What's Working:
- ✅ User authentication (Login/Signup)
- ✅ Dashboard with daily briefing
- ✅ Project Management (Create, Edit, Delete projects)
- ✅ Task Management (Create, Edit, Delete, Complete tasks)
- ✅ Calendar view
- ✅ AI Assistant
- ✅ Task Templates (8 pre-loaded templates)
- ✅ Team member management
- ✅ File attachments
- ✅ Dark/Light mode
- ✅ Supabase integration
- ✅ Real-time data sync
- ✅ Responsive design

### What's NOT in This Version:
- ❌ Advanced task dependencies
- ❌ Subtask management in modal
- ❌ Recurring task automation
- ❌ Template selector in task modal
- ❌ Bundle size optimizations

### Key Files:
- **Build config:** Tailwind CSS properly configured
- **Entry point:** `main.tsx` imports `index.css`
- **Styling:** Full Tailwind utilities (51KB CSS bundle)
- **Database:** Supabase with users, projects, tasks tables

---

## 📦 How to Restore to This Version

### Method 1: Using Git Tag (Recommended)

```bash
# Check available tags
git tag

# Restore to this stable version
git checkout v1.1-stable-dec22

# Create a new branch from this point if needed
git checkout -b stable-branch

# Or reset main to this version (CAUTION: loses newer commits)
git reset --hard v1.1-stable-dec22
```

### Method 2: Using Commit Hash

```bash
# Restore to specific commit
git checkout 565e3b9

# Or reset to this commit
git reset --hard 565e3b9
```

### Method 3: From GitHub

1. Go to: https://github.com/richardsgs1/Pimbot-v2
2. Click "Releases" or "Tags"
3. Download `v1.1-stable-dec22`
4. Extract and replace your local files

---

## 🔧 Setup After Restore

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` file with:
```env
VITE_SUPABASE_URL=https://qfkhxrcbtgllzffnnxhp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Build
```bash
npm run build
```

### 4. Deploy to Vercel
```bash
vercel --prod
```

---

## 📁 Files to Backup to Google Drive

### Essential Files (Backup These):
```
✅ package.json
✅ package-lock.json
✅ vite.config.ts
✅ tailwind.config.js
✅ postcss.config.js
✅ tsconfig.json
✅ index.html
✅ main.tsx
✅ index.css
✅ App.tsx
```

### Full Directories (Backup These):
```
✅ components/ (all component files)
✅ lib/ (all service files)
✅ types.ts
✅ supabase/migrations/ (database migrations)
✅ css/ (calendar styles)
```

### Exclude from Backup:
```
❌ node_modules/
❌ dist/
❌ .git/ (already on GitHub)
❌ .vercel/
```

---

## 🗄️ Google Drive Backup Structure

Recommended folder structure:
```
Google Drive/
└── PiMbOt Backups/
    └── v1.1-stable-dec22-2025-12-22/
        ├── README.md (this file)
        ├── source-code.zip
        ├── package.json
        ├── screenshots/
        │   ├── dashboard.png
        │   └── login.png
        └── database-schema/
            └── supabase-migrations.sql
```

---

## 🚀 Deployment Info

**Current Deployment:**
- Platform: Vercel
- URL: https://pimbot-v2.vercel.app
- Branch: main
- Auto-deploy: Enabled

**Build Settings:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

---

## 📊 Current Stats

- **Bundle Size:** ~1.05 MB (312 KB gzipped)
- **CSS Bundle:** 51 KB (9 KB gzipped)
- **Users:** 1 (Test35)
- **Projects:** 3
- **Templates:** 8
- **Build Time:** ~6 seconds

---

## 🛡️ Before Adding New Features

1. ✅ **Create a new branch**
   ```bash
   git checkout -b feature/advanced-tasks
   ```

2. ✅ **Test locally first**
   ```bash
   npm run dev
   ```

3. ✅ **Build before deploying**
   ```bash
   npm run build
   ```

4. ✅ **Commit frequently**
   ```bash
   git add -A
   git commit -m "Descriptive message"
   ```

5. ✅ **Can always revert**
   ```bash
   git checkout v1.1-stable-dec22
   ```

---

## 📝 Notes

- This version uses base Tailwind with no CDN
- PostCSS and Tailwind configs are required
- CSS must be imported in main.tsx
- Supabase client is singleton (lib/supabase.ts)
- No console logs in production

---

## 🆘 Emergency Restore

If everything breaks:
```bash
# Quick restore to working version
git checkout v1.1-stable-dec22
npm install
npm run build
git push origin main --force
```

Then redeploy on Vercel.

---

**Created:** December 22, 2025
**Last Updated:** December 22, 2025
**Version:** 1.1 Stable
**Author:** PiMbOt Development Team
