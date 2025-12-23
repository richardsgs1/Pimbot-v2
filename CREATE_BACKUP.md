# How to Create Google Drive Backup

## Quick Steps

### 1. Create Backup Folder on Google Drive
```
Google Drive > PiMbOt Backups > v1.1-stable-dec22
```

### 2. Files to Upload

**Option A: Upload Individual Folders**
- Upload `components/` folder
- Upload `lib/` folder
- Upload `supabase/` folder
- Upload these files:
  - package.json
  - package-lock.json
  - vite.config.ts
  - tailwind.config.js
  - postcss.config.js
  - index.html
  - main.tsx
  - index.css
  - App.tsx
  - types.ts
  - BACKUP_RESTORE_GUIDE.md

**Option B: Create ZIP (Recommended)**

On Windows:
```powershell
# In PowerShell, navigate to project folder
cd c:\Users\richa\OneDrive\Documents\Projects\Pimbot-v2

# Create zip excluding node_modules and dist
Compress-Archive -Path .\* -DestinationPath ..\pimbot-v2-stable-dec22.zip -Force -Exclude node_modules,dist,.git,.vercel
```

On Mac/Linux:
```bash
cd ~/Projects/Pimbot-v2
zip -r ../pimbot-v2-stable-dec22.zip . -x "node_modules/*" "dist/*" ".git/*" ".vercel/*"
```

Then upload `pimbot-v2-stable-dec22.zip` to Google Drive.

### 3. Take Screenshots
- Dashboard view
- Project Management view
- Task detail view
- Login screen

Upload to Google Drive folder: `screenshots/`

### 4. Export Database Schema
Already created in:
- `supabase/migrations/` folder

Upload this entire folder to Google Drive.

---

## Restore from Google Drive Backup

### 1. Download ZIP from Google Drive

### 2. Extract to Project Folder
```bash
unzip pimbot-v2-stable-dec22.zip -d ~/Projects/Pimbot-v2-restored
```

### 3. Install Dependencies
```bash
cd ~/Projects/Pimbot-v2-restored
npm install
```

### 4. Test Locally
```bash
npm run dev
```

### 5. Deploy
```bash
npm run build
vercel --prod
```

---

## Verification Checklist

After restore, verify:
- [ ] npm install works without errors
- [ ] npm run build succeeds
- [ ] npm run dev shows app locally
- [ ] Login page loads
- [ ] Can create/view projects
- [ ] Can create/view tasks
- [ ] Database connection works
- [ ] Deployed version works on Vercel

---

**Backup Created:** December 22, 2025
**Next Backup:** Before next major feature addition
