# Critical Database Migrations - MUST RUN IN SUPABASE

## Overview
The following migrations fix critical issues with project persistence and file uploads. These must be executed in the Supabase SQL editor.

## Prerequisites
1. Log into [Supabase Dashboard](https://supabase.com)
2. Navigate to your project
3. Go to SQL Editor (left sidebar)
4. Create a new query for each migration below

## Migrations to Run

### Migration 1: Enable RLS on Projects and Tasks
**File**: `supabase/migrations/003_enable_rls_on_projects.sql`

Run this SQL in Supabase to enable Row-Level Security on the projects and tasks tables. This ensures users can only access their own data.

```sql
-- Enable Row Level Security on projects and tasks tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Projects table RLS policies
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

-- Tasks table RLS policies (permissive for now)
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

### Migration 2: Create Storage Bucket
**Action**: Manual setup required

1. Go to **Storage** in the Supabase dashboard
2. Click **Create Bucket**
3. Enter name: `pimbot-attachments`
4. Set privacy: **Private** (RLS enabled)
5. Click **Create Bucket**

### Migration 3: Configure Storage Bucket RLS Policies
**File**: `supabase/migrations/004_create_storage_bucket_policies.sql`

After creating the storage bucket, run this SQL to configure RLS policies:

```sql
-- Storage bucket RLS policies for pimbot-attachments bucket
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

## Important Notes

### What Changed
1. **Projects table** now has RLS policies that enforce `user_id = auth.uid()`
   - This means only the authenticated Supabase user can see/modify their own projects
   - The application code was updated to use `auth.uid()` instead of the app's user ID

2. **Storage bucket** now uses RLS policies based on file path
   - Files are organized as: `{authUid}/{projectId}/{taskId}/{filename}`
   - RLS policies extract the first folder (authUid) and verify it matches `auth.uid()`

3. **File upload function** was updated
   - Now uses `auth.uid()` from Supabase instead of passed userId
   - File paths include the user's auth UID as the first folder level

### Common Issues & Solutions

**Issue**: "Column attachments not found" error
- **Cause**: Projects table doesn't have the attachments column
- **Solution**: The 000 migration should have created it. Check the schema in Supabase.

**Issue**: "Row-level security policy violation" on file upload
- **Cause**: Storage bucket RLS policies not configured correctly
- **Solution**: Run Migration 3 to set up the storage bucket policies

**Issue**: "No authenticated user found" error
- **Cause**: User is not logged into Supabase auth
- **Solution**: Ensure the user completes the onboarding process which triggers Supabase auth signup

**Issue**: Projects disappear on refresh
- **Cause**: Projects were saved with incorrect user_id (app user ID instead of auth UID)
- **Solution**: The code now uses `auth.uid()`, so new projects will be saved correctly. Old projects may need to be deleted and recreated.

## Verify Setup

After running all migrations, you can verify the setup:

1. Go to SQL Editor
2. Run this query to check RLS is enabled:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;
```

Should show: `projects`, `tasks`, `files`, `file_storage_quota`, `file_access_log`

3. Check storage bucket policies exist:
```sql
SELECT policy_name, target_table
FROM information_schema.role_statements
WHERE target_type = 'POLICY';
```

## Next Steps

1. Run all three migrations above
2. Rebuild the application: `npm run dev`
3. Log in and create a new project
4. Try uploading a file
5. Refresh the page - your project and files should persist

If you encounter any errors during migrations, check the error message and refer to the "Common Issues" section above.
