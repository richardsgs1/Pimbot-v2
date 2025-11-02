-- Check if RLS policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('files', 'file_storage_quota', 'file_access_log')
ORDER BY tablename, policyname;
