import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useAdminCheck() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ['is-admin', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId!)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
      return !!data;
    },
  });

  return { isAdmin, loading: !!userId && isLoading };
}
