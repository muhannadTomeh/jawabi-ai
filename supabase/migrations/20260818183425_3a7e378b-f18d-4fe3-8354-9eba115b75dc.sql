-- Migration: expose_user_emails_to_admin
-- Description: Grant select on auth.users to allow the app to query emails for administrative purposes,
-- but since we cannot directly grant on auth.users from here easily in some environments,
-- we'll create a security definer function to fetch the email.

-- Security Definer function to get email
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to use this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN NULL;
  END IF;

  RETURN (SELECT email FROM auth.users WHERE id = p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO service_role;
