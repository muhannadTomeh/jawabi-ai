-- Add new tag types to app_tag enum if not exists (Supabase enum migration can be tricky, so we check)
-- However, we can just use the existing tags and expand logic or just add a new column for AI classification.
-- The user asked for specific categories: Committed/Satisfied (Regular/VIP), Important (VIP), Problems (Must follow up), Prospects (Prospect), Blacklist (Blocked).
-- I will add a new column 'ai_classification' to the customers table.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ai_classification text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_classification_at timestamptz;

-- Function to record and classify customer in one go (or trigger it)
-- We'll update record_customer_contact to include classification if needed, 
-- but a separate trigger or background job is better for AI.
-- For now, let's just make sure the column exists.

GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
