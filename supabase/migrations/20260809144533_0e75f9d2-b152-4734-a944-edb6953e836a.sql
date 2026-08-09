DO $$
DECLARE
    table_list text[] := ARRAY['queue', 'customers', 'invoices', 'workers', 'work_records', 'worker_payments', 'oil_transactions', 'expenses', 'container_types'];
    t_name text;
BEGIN
    FOREACH t_name IN ARRAY table_list
    LOOP
        -- Check if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t_name) THEN
            -- Check if both user_id and season_id exist
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'user_id') 
               AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'season_id') THEN
                EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(user_id, season_id)', 'idx_' || t_name || '_user_season', t_name);
            -- Check if only user_id exists
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t_name AND column_name = 'user_id') THEN
                EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(user_id)', 'idx_' || t_name || '_user', t_name);
            END IF;
        END IF;
    END LOOP;
END $$;