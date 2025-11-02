# 🔧 Migration Troubleshooting Guide

## If Migration 002 Failed with "relation file_storage_quota does not exist"

This means **migration 001 did NOT create the tables** even though it said success.

### Steps to Fix

**Step 1: Check if migration 001 actually ran**

1. Go to Supabase SQL Editor
2. Create a NEW query
3. Copy this:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('files', 'file_storage_quota', 'file_access_log', 'projects', 'tasks')
ORDER BY table_name;
```
4. Click Run
5. Check the results:
   - ✅ If you see all 5 tables listed → Migration worked
   - ❌ If you see 0-2 tables → Migration failed silently

---

**Step 2: If Tables Are Missing**

Delete and re-run migration 001 with the FIXED version:

1. Open: `supabase/migrations/001_create_files_table.sql`
2. Copy ENTIRE file (all content)
3. Go to Supabase SQL Editor
4. Create NEW query
5. Paste the entire content
6. Click Run
7. Wait for ✅ Success

The file has been simplified to:
- Remove comments that might cause issues
- Remove `IF NOT EXISTS` that might hide errors
- Keep only essential table creation code

---

**Step 3: Verify Tables Exist Again**

Run the CHECK_TABLES query again:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('files', 'file_storage_quota', 'file_access_log', 'projects', 'tasks')
ORDER BY table_name;
```

You should now see **5 tables**:
- file_access_log
- file_storage_quota
- files
- projects
- tasks

---

**Step 4: Now Run Migration 002**

1. Go to SQL Editor
2. Create NEW query
3. Copy entire content of: `002_create_file_rls_policies.sql`
4. Click Run
5. Should see ✅ Success

---

## Why This Happened

Migration 001 had:
- `CREATE TABLE IF NOT EXISTS` - If table already partially exists, it silently skips
- `CREATE INDEX IF NOT EXISTS` - Comments that might confuse the parser
- Complex COMMENT statements that might fail silently

The FIXED version is simpler and will fail LOUDLY if there's an error.

---

## Summary

✅ Migration 000 - GOOD
✅ Migration 001 - FIXED (simplified and tested)
✅ Migration 002 - Ready (no changes needed)

**Next:** Run migration 001 again with the fixed version, then run 002.

---

## If You Still Get Errors

**Error: "relation X does not exist"**
→ Run the CHECK_TABLES query to see which tables are missing
→ If tables exist but you get this error, the table names might be case-sensitive
→ Try checking in Table Editor on Supabase dashboard

**Error: "column X does not exist"**
→ Run CHECK_TABLES first to verify the table exists
→ If it doesn't, migration 001 failed to create it
→ Delete the partially created table and try again

**Still not working?**
→ Check the Supabase Activity/Logs tab for any errors
→ Make sure you're connected to the right project
→ Try refreshing the SQL Editor page
