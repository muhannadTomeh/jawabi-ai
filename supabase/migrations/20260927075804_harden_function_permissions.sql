-- Helper functions used by RLS must not be exposed to anonymous callers.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE SELECT ON TABLE public.user_roles FROM anon;

-- Email lookup is for the authenticated admin UI only. The function also
-- performs its own role check, but explicit grants provide defense in depth.
REVOKE ALL ON FUNCTION public.get_user_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated, service_role;

-- Internal event-trigger helper; clients never need to call it through RPC.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
