DROP POLICY IF EXISTS "Anyone can view plans" ON public.plans;

CREATE POLICY "Authenticated users can view plans"
ON public.plans
FOR SELECT
TO authenticated
USING (true);

REVOKE ALL ON public.plans FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;