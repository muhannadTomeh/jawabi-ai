-- Ensure grants on plans
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

-- 2. Update chatbots to reference plans (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatbots' AND column_name = 'plan_id') THEN
        ALTER TABLE public.chatbots ADD COLUMN plan_id uuid REFERENCES public.plans(id);
    END IF;
END $$;

UPDATE public.chatbots SET plan_id = (SELECT id FROM public.plans WHERE slug = 'free') WHERE plan_id IS NULL;

-- 3. API Providers table
CREATE TABLE IF NOT EXISTS public.api_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_key text UNIQUE NOT NULL, 
    display_name text NOT NULL,
    api_key text,
    is_active boolean DEFAULT false NOT NULL,
    last_validated_at timestamptz,
    last_models_sync_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_providers TO authenticated; 
GRANT ALL ON public.api_providers TO service_role;

ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage api_providers" ON public.api_providers;
CREATE POLICY "Admins can manage api_providers" ON public.api_providers
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. API Provider Models table
CREATE TABLE IF NOT EXISTS public.api_provider_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id uuid REFERENCES public.api_providers(id) ON DELETE CASCADE NOT NULL,
    model_id text NOT NULL,
    display_name text NOT NULL,
    fetched_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.api_provider_models TO authenticated;
GRANT ALL ON public.api_provider_models TO service_role;

ALTER TABLE public.api_provider_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read api_provider_models" ON public.api_provider_models;
CREATE POLICY "Anyone authenticated can read api_provider_models" ON public.api_provider_models
    FOR SELECT TO authenticated USING (true);

-- Insert default fallback provider
INSERT INTO public.api_providers (provider_key, display_name, is_active)
VALUES ('lovable_gateway', 'Lovable AI Gateway', true)
ON CONFLICT (provider_key) DO NOTHING;

-- 5. Replace get_chatbot_daily_usage
DROP FUNCTION IF EXISTS public.get_chatbot_daily_usage(uuid);

CREATE OR REPLACE FUNCTION public.get_chatbot_daily_usage(_chatbot_id uuid)
RETURNS TABLE (
    used bigint,
    limit_value integer,
    plan_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        COALESCE(SUM(rlc.request_count), 0)::bigint as used,
        COALESCE(p.messages_per_day, c.daily_message_limit, 300) as limit_value,
        COALESCE(p.name, 'أساسي') as plan_name
    FROM public.chatbots c
    LEFT JOIN public.plans p ON c.plan_id = p.id
    LEFT JOIN public.rate_limit_counters rlc ON 
        rlc.bucket_key = 'chatbot_daily:' || c.id::text
        AND rlc.window_start >= (now() AT TIME ZONE 'UTC')::date
    WHERE c.id = _chatbot_id
    GROUP BY c.id, p.messages_per_day, c.daily_message_limit, p.name;
$$;
