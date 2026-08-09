-- The user_roles table seems to have a UNIQUE constraint on user_id alone, 
-- which prevents multiple roles for one user. We need to fix this.

-- 1. Drop the restrictive unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
    ) THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_key;
    END IF;
END $$;

-- 2. Add the correct multi-column unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
END $$;

-- 3. Now the insert should work with ON CONFLICT (user_id, role)
INSERT INTO public.user_roles (user_id, role)
VALUES ('3800a402-dc0c-4b7c-a218-f39e0c427ac7', 'platform_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Ensure the function is correct and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Ensure RLS and Policy
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can view their own roles'
    ) THEN
        CREATE POLICY "Users can view their own roles"
        ON public.user_roles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. Grants
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;