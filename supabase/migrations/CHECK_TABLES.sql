-- Run this to check which tables exist
-- If tables don't show up, the migrations didn't work

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('files', 'file_storage_quota', 'file_access_log', 'projects', 'tasks')
ORDER BY table_name;