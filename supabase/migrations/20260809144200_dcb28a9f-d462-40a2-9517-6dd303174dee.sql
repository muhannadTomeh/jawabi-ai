-- 1. Restrict public access to SECURITY DEFINER function has_role
-- It's a security definer, so we should only allow specific roles to execute it.
-- PostgREST (Data API) grants execute to public by default.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 2. Handle other potential SECURITY DEFINER functions if they were flagged 
-- We'll look for other common ones in this project based on context (like check_and_increment_rate_limit)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.prosecdef = true 
          AND n.nspname = 'public'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC', func_record.nspname, func_record.proname, func_record.args);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM authenticated', func_record.nspname, func_record.proname, func_record.args);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon', func_record.nspname, func_record.proname, func_record.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', func_record.nspname, func_record.proname, func_record.args);
    END LOOP;
END $$;