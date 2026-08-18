ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ai_classification text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_classification_at timestamptz;
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
