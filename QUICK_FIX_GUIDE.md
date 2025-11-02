# ⚡ Quick Fix Guide - Run These 3 Migrations in Order

## The Problem Fixed ✅
- ❌ Migration 001 failed because `projects` and `tasks` tables didn't exist
- ✅ Created migration 000 to build those tables first
- ✅ Now all 3 migrations will succeed

## The Solution

### Do This in Supabase SQL Editor (Run in order):

**1️⃣ First Migration - FIXED VERSION**
```
File: supabase/migrations/000_create_projects_and_tasks_tables.sql
Copy entire file → Paste in SQL Editor → Click Run
Expected: ✅ Success
```
Creates: `projects` and `tasks` tables with proper structure

**2️⃣ Second Migration**
```
File: supabase/migrations/001_create_files_table.sql
Copy entire file → Paste in SQL Editor → Click Run
Expected: ✅ Success
```
Creates: `files`, `file_storage_quota`, `file_access_log` tables

**3️⃣ Third Migration**
```
File: supabase/migrations/002_create_file_rls_policies.sql
Copy entire file → Paste in SQL Editor → Click Run
Expected: ✅ Success
```
Creates: Security policies for Row-Level Security

---

## Verify It Worked

### Tables Created
Check **Table Editor** for these 5 new tables:
- [ ] projects
- [ ] tasks
- [ ] files
- [ ] file_storage_quota
- [ ] file_access_log

### RLS Enabled
1. Click `files` table
2. Click **Authentication** tab
3. See ✓ RLS enabled with 8 policies

---

## Test It

```bash
npm run dev
```

Visit your project page:
- ✅ Upload file → see progress bar
- ✅ Search files → instant results
- ✅ Filter by type → updates list
- ✅ See storage quota → shows usage

---

## If You Get An Error

**Restart:**
1. Go back to SQL Editor
2. Delete what you pasted
3. Copy the full migration file again
4. Paste fresh copy
5. Click Run

**Most likely cause of error:** Partial paste or copy/paste issue

**Fix:** Copy the ENTIRE migration file, paste it all at once, run it

---

## That's It!

Three simple migrations, run in order. Your file storage system is ready! 🚀
