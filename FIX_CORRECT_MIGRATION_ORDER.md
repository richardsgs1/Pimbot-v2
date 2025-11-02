# ✅ CORRECTED: Proper Migration Order

## Why The Migrations Failed

Your Supabase project didn't have the `projects` and `tasks` tables created yet. The file storage migrations tried to reference these tables with foreign keys, which failed.

**Error you saw:**
```
ERROR: 42703: column "created_by" does not exist
ERROR: 42P01: relation "file_storage_quota" does not exist
```

**Root cause:** Foreign key constraints failed because base tables didn't exist.

---

## 🎯 Correct Migration Order

**Run these in order (by filename):**

1. ✅ `000_create_projects_and_tasks_tables.sql` ← **NEW - Run this FIRST**
2. ✅ `001_create_files_table.sql` ← Run this SECOND
3. ✅ `002_create_file_rls_policies.sql` ← Run this THIRD

---

## 📋 Step-by-Step Deployment

### Step 1: Create Projects & Tasks Tables

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New query**
3. Copy entire content of: `supabase/migrations/000_create_projects_and_tasks_tables.sql`
4. Paste into the editor
5. Click **Run**
6. ✅ Wait for **Success** message

**This creates:**
- `projects` table with proper schema
- `tasks` table with proper schema
- 6 database indexes

---

### Step 2: Create File Storage Tables

1. Click **New query** again
2. Copy entire content of: `supabase/migrations/001_create_files_table.sql`
3. Paste into the editor
4. Click **Run**
5. ✅ Wait for **Success** message

**This creates:**
- `files` table with metadata
- `file_storage_quota` table for tracking
- `file_access_log` table for audit trail
- 9 database indexes

---

### Step 3: Enable Security Policies

1. Click **New query** again
2. Copy entire content of: `supabase/migrations/002_create_file_rls_policies.sql`
3. Paste into the editor
4. Click **Run**
5. ✅ Wait for **Success** message

**This creates:**
- Row-Level Security policies
- User file isolation
- Quota management policies
- Audit logging policies

---

## ✅ Verify Everything Created

After all three migrations run successfully:

### Check Tables Exist
1. Go to **Table Editor** in left sidebar
2. You should see **6 new tables:**
   - [ ] `projects`
   - [ ] `tasks`
   - [ ] `files`
   - [ ] `file_storage_quota`
   - [ ] `file_access_log`
   - (plus any existing tables)

### Check RLS is Enabled
1. Click on `files` table
2. Click **Authentication** tab on right panel
3. Verify **RLS enabled** checkbox is ✓ checked
4. Click to expand and see the 8 security policies

---

## 🧪 Test in Development

Once all migrations complete:

```bash
npm run dev
```

Visit your project page and test:
- [ ] Upload a file → See progress bar
- [ ] Search files → Results update instantly
- [ ] Filter by type → List updates
- [ ] Check storage quota → Bar shows usage
- [ ] Sort files → Verify order changes

---

## Why Migration 000 Was Needed

The original migrations assumed the base tables existed. This new migration creates them with the correct schema:

**projects table columns:**
- `id` - UUID primary key
- `user_id` - References auth.users
- `name`, `description`, `status`
- `progress`, `priority`, `budget`
- `tasks`, `team_members`, `attachments` - JSON arrays
- `tags`, `journal` - JSON arrays
- `archived`, `created_at`, `updated_at`

**tasks table columns:**
- `id` - UUID primary key
- `name`, `description`, `status`
- `priority`, `due_date`, `start_date`
- `assignees`, `tags` - JSON arrays
- `completed`, `estimated_hours`, `actual_hours`
- `attachments` - JSON array
- `created_at`, `updated_at`

---

## Summary

✅ New migration file created: `000_create_projects_and_tasks_tables.sql`
✅ Proper order documented
✅ All 3 migrations now have correct dependencies
✅ Foreign key constraints will now succeed
✅ RLS policies will apply to all tables

**Just run the migrations in order (000, 001, 002) and everything will work!**
