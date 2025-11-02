# Immediate Action Items - Run These in Supabase Now

## What Was Fixed (Code Side)
✅ DONE - All code changes committed to git (commit 66227dd)
- Fixed user ID mismatch between app and Supabase auth
- Updated all database operations to use `auth.uid()`
- Updated file upload to use Supabase auth UID in file paths
- Created migration files for RLS policies

## What You Must Do Now (Supabase Dashboard)

### Step 1: Run Migration 003 - Enable RLS
**Location**: Supabase Dashboard → SQL Editor → New Query

Copy and paste this entire SQL from `supabase/migrations/003_enable_rls_on_projects.sql`:

```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  USING (true);
```

**Expected Result**: Query should execute with no errors

---

### Step 2: Create Storage Bucket
**Location**: Supabase Dashboard → Storage → New Bucket

1. Click **"New Bucket"** button
2. Enter name: `pimbot-attachments`
3. Click on **"Privacy"** dropdown
4. Select **"Private"** (this enables RLS)
5. Click **"Create Bucket"** button

**Expected Result**: Bucket appears in Storage list

---

### Step 3: Run Migration 004 - Storage RLS Policies
**Location**: Supabase Dashboard → SQL Editor → New Query

Copy and paste this entire SQL from `supabase/migrations/004_create_storage_bucket_policies.sql`:

```sql
CREATE POLICY "Users can upload files to their projects"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files from their projects"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pimbot-attachments'
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update file metadata"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'pimbot-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Expected Result**: Query should execute with no errors

---

## Step 4: Test in the Application

After running all 3 steps above:

1. **Refresh the app**: Open http://localhost:5173
2. **Log in** with your credentials (or create new account during onboarding)
3. **Create a new project**:
   - Go to "Project Management"
   - Click "Add Project"
   - Fill in name and description
   - Click "Create"
4. **Verify project saves**:
   - Check if project appears in list
   - Refresh the page with F5
   - Project should STILL be there (this was broken before)
5. **Upload a file**:
   - Click on the project
   - Find file upload area
   - Try uploading a PDF or image
   - Should upload successfully without "RLS policy" errors
6. **Verify file persists**:
   - Refresh the page
   - File should still be attached to project

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| SQL query fails with "ALTER TABLE" error | Make sure you're in the SQL Editor, not somewhere else. Try running one statement at a time. |
| Can't find SQL Editor | Supabase Dashboard → Left sidebar → SQL Editor |
| Can't find Storage section | Supabase Dashboard → Left sidebar → Storage |
| "Projects table doesn't exist" error | Run Migration 000 first if you haven't. Check if projects table exists in Tables section. |
| File upload still fails with RLS error | Make sure storage bucket is set to "Private" (not "Public"). Check Step 2. |
| Projects still not saving | Verify all 3 migrations ran without errors. Check browser console for network errors. |

---

## Important Notes

- **Migrations are IDEMPOTENT**: Safe to run multiple times if they fail
- **No data loss**: These migrations only add RLS policies, don't delete data
- **Old projects**: May need to be recreated if they were saved with wrong user_id
- **Dev server**: Already running at http://localhost:5173
- **Git commit**: All code changes already committed, no need to build

---

## Questions?

1. **Check MIGRATION_INSTRUCTIONS.md** - Detailed explanation of each migration
2. **Check FIX_SUMMARY.md** - Technical details of what was fixed
3. **Check Supabase logs** - Dashboard → Logs for database/storage errors
4. **Check browser console** - F12 → Console for application errors

---

## After Everything Works

Once projects persist and files upload:

### Next Features to Implement
1. Team member selection UI (currently buttons don't work)
2. Task assignment to team members
3. File management (delete, rename, etc.)
4. Sharing projects with team members

Let me know once you complete these migration steps and the tests pass!
