-- 1. counters table
CREATE TABLE public.rate_limit_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_key, window_start)
);

GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to rate limit counters"
  ON public.rate_limit_counters FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE INDEX idx_rate_limit_counters_window ON public.rate_limit_counters (window_start);
CREATE INDEX idx_rate_limit_counters_bucket ON public.rate_limit_counters (bucket_key);

-- 2. violations table
CREATE TABLE public.rate_limit_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  limit_type text NOT NULL,
  chatbot_id uuid,
  channel text,
  identifier text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rate_limit_violations TO authenticated;
GRANT ALL ON public.rate_limit_violations TO service_role;
ALTER TABLE public.rate_limit_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their chatbot violations"
  ON public.rate_limit_violations FOR SELECT TO authenticated
  USING (chatbot_id IS NOT NULL AND public.is_chatbot_owner(chatbot_id));

CREATE POLICY "Admins can view all violations"
  ON public.rate_limit_violations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_rate_limit_violations_created ON public.rate_limit_violations (created_at DESC);

-- 3. per-chatbot daily limit
ALTER TABLE public.chatbots
  ADD COLUMN daily_message_limit integer NOT NULL DEFAULT 300;

-- 4. atomic fixed-window check
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start timestamptz;
  v_count integer;
BEGIN
  IF p_max_requests IS NULL OR p_max_requests <= 0 THEN
    RETURN true;
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_counters (bucket_key, window_start, request_count)
  VALUES (p_bucket_key, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = public.rate_limit_counters.request_count + 1
  RETURNING request_count INTO v_count;

  -- opportunistic cleanup (~1% of calls)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limit_counters
     WHERE window_start < now() - interval '2 hours'
       AND window_start < date_trunc('day', now());
  END IF;

  RETURN v_count <= p_max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(text, integer, integer) TO service_role;