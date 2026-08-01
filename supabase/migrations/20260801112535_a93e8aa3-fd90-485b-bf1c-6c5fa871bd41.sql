CREATE OR REPLACE FUNCTION public.get_chatbot_daily_usage(_chatbot_id uuid)
RETURNS TABLE(used integer, limit_value integer)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start timestamptz;
BEGIN
  IF NOT public.is_chatbot_owner(_chatbot_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / 86400) * 86400);

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT c.request_count FROM public.rate_limit_counters c
       WHERE c.bucket_key = 'chatbot_daily:' || _chatbot_id::text
         AND c.window_start = v_window_start
    ), 0)::integer,
    COALESCE((SELECT b.daily_message_limit FROM public.chatbots b WHERE b.id = _chatbot_id), 300)::integer;
END;
$$;

REVOKE ALL ON FUNCTION public.get_chatbot_daily_usage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chatbot_daily_usage(uuid) TO authenticated, service_role;