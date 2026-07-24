CREATE OR REPLACE FUNCTION public.set_chatbot_public_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.public_slug IS NULL THEN
    NEW.public_slug := encode(extensions.gen_random_bytes(8), 'hex');
  END IF;
  RETURN NEW;
END;
$function$;