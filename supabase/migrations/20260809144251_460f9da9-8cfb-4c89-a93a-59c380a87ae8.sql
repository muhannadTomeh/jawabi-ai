DO $$
DECLARE
    table_names text[] := ARRAY[
        'profiles', 'seasons', 'queue', 'customers', 'invoices', 
        'workers', 'work_records', 'worker_payments', 'expenses', 
        'inventory', 'oil_transactions', 'container_types'
    ];
    t_name text;
BEGIN
    FOREACH t_name IN ARRAY table_names
    LOOP
        -- First verify table exists in public schema
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t_name
        ) THEN
            -- Add policy if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = t_name AND policyname = 'Platform admin can view all ' || t_name
            ) THEN
                EXECUTE format(
                    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''platform_admin''))',
                    'Platform admin can view all ' || t_name,
                    t_name
                );
            END IF;
        END IF;
    END LOOP;
END $$;