ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS language_preference TEXT NOT NULL DEFAULT 'ar',
  ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "in_app": true, "handover": true}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL AND username <> '';