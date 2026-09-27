-- Replace legacy model identifiers with direct OpenAI API-compatible values.
UPDATE public.llm_settings
SET model = 'gpt-4.1-mini'
WHERE model LIKE 'google/%' OR model LIKE 'openai/%';
