-- Gemini 3.8 returned transient capacity errors during deployment verification.
-- Prefer the lower-latency model while keeping 3.8 selectable in the UI.
ALTER TABLE public.llm_settings
  ALTER COLUMN model SET DEFAULT 'gemini-3.5-flash-lite';

UPDATE public.llm_settings
SET model = 'gemini-3.5-flash-lite', updated_at = now()
WHERE model = 'gemini-3.8-flash';
