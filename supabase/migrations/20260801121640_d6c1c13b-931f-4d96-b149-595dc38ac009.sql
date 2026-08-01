CREATE OR REPLACE FUNCTION public.set_default_plan()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_id IS NULL THEN
    NEW.plan_id := (SELECT id FROM public.plans WHERE is_default LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chatbots_set_default_plan
BEFORE INSERT ON public.chatbots
FOR EACH ROW EXECUTE FUNCTION public.set_default_plan();

CREATE OR REPLACE FUNCTION public.get_chatbot_daily_usage(_chatbot_id uuid)
RETURNS TABLE(used integer, limit_value integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
    COALESCE(
      (SELECT p.messages_per_day FROM public.chatbots b
         JOIN public.plans p ON p.id = b.plan_id
        WHERE b.id = _chatbot_id),
      (SELECT b.daily_message_limit FROM public.chatbots b WHERE b.id = _chatbot_id),
      300
    )::integer;
END;
$$;