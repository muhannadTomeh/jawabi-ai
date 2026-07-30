UPDATE public.handover_settings
SET enabled = true,
    trigger_on_sale = true,
    updated_at = now()
WHERE chatbot_id = '95e574e5-06dc-452c-8163-68288b338db7';