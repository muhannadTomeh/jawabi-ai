-- Objects present in the Lovable database backup but missing from the checked-in
-- migration history. Keep this migration idempotent so existing projects are safe.

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  messages_per_day integer NOT NULL DEFAULT 300,
  messages_per_minute_per_chatbot integer NOT NULL DEFAULT 60,
  max_channels integer NOT NULL DEFAULT 4,
  max_knowledge_items integer,
  allowed_model text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS plans_single_default_idx
  ON public.plans (is_default) WHERE is_default;

ALTER TABLE public.chatbots
  ADD COLUMN IF NOT EXISTS daily_message_limit integer NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS plan_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chatbots_plan_id_fkey'
      AND conrelid = 'public.chatbots'::regclass
  ) THEN
    ALTER TABLE public.chatbots
      ADD CONSTRAINT chatbots_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  admin_user_id uuid NOT NULL,
  admin_email text,
  target_user_id uuid,
  target_email text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
  ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target
  ON public.admin_audit_log (target_user_id);

CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_bucket
  ON public.rate_limit_counters (bucket_key);
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_window
  ON public.rate_limit_counters (window_start);

CREATE TABLE IF NOT EXISTS public.rate_limit_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  limit_type text NOT NULL,
  chatbot_id uuid,
  channel text,
  identifier text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_created
  ON public.rate_limit_violations (created_at DESC);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view plans"
  ON public.plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert plans"
  ON public.plans FOR INSERT TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Admins can update plans"
  ON public.plans FOR UPDATE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Admins can delete plans"
  ON public.plans FOR DELETE TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));

CREATE POLICY "No client access to rate limit counters"
  ON public.rate_limit_counters FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "Admins can view all violations"
  ON public.rate_limit_violations FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Owners can view their chatbot violations"
  ON public.rate_limit_violations FOR SELECT TO authenticated
  USING (chatbot_id IS NOT NULL AND public.is_chatbot_owner(chatbot_id));

REVOKE ALL ON public.plans, public.admin_audit_log,
  public.rate_limit_counters, public.rate_limit_violations FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT SELECT ON public.admin_audit_log, public.rate_limit_violations TO authenticated;
GRANT ALL ON public.plans, public.admin_audit_log,
  public.rate_limit_counters, public.rate_limit_violations TO service_role;

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_max_requests IS NULL OR p_max_requests <= 0 THEN
    RETURN true;
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_counters (bucket_key, window_start, request_count)
  VALUES (p_bucket_key, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = public.rate_limit_counters.request_count + 1
  RETURNING request_count INTO v_count;

  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_counters
    WHERE window_start < now() - interval '2 hours'
      AND window_start < date_trunc('day', now());
  END IF;

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.get_chatbot_daily_usage(_chatbot_id uuid)
RETURNS TABLE(used integer, limit_value integer, plan_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
BEGIN
  IF NOT public.is_chatbot_owner(_chatbot_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_window_start := to_timestamp(floor(extract(epoch FROM now()) / 86400) * 86400);

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT c.request_count
      FROM public.rate_limit_counters c
      WHERE c.bucket_key = 'chatbot_daily:' || _chatbot_id::text
        AND c.window_start = v_window_start
    ), 0)::integer,
    COALESCE(
      (SELECT p.messages_per_day
       FROM public.chatbots b JOIN public.plans p ON p.id = b.plan_id
       WHERE b.id = _chatbot_id),
      (SELECT b.daily_message_limit FROM public.chatbots b WHERE b.id = _chatbot_id),
      300
    )::integer,
    (SELECT p.name
     FROM public.chatbots b JOIN public.plans p ON p.id = b.plan_id
     WHERE b.id = _chatbot_id)::text;
END;
$$;

REVOKE ALL ON FUNCTION public.get_chatbot_daily_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chatbot_daily_usage(uuid)
  TO authenticated, service_role;
