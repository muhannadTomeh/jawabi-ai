-- Use Google Gemini directly instead of the previous AI provider.
ALTER TABLE public.llm_settings
  ALTER COLUMN model SET DEFAULT 'gemini-3.8-flash';

UPDATE public.llm_settings
SET model = 'gemini-3.8-flash', updated_at = now()
WHERE model LIKE 'gpt-%'
   OR model LIKE 'openai/%'
   OR model LIKE 'google/%';
