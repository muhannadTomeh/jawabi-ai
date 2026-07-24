import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Chatbot {
  id: string;
  name: string;
  user_id: string;
  is_active: boolean;
  language: string;
  tone: string;
  fallback_message: string;
  welcome_message: string;
  custom_instructions: string;
  dialect: string;
  created_at: string;
  updated_at: string;
  business_name?: string | null;
  business_category?: string | null;
  business_location?: string | null;
  business_description?: string | null;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  public_slug?: string | null;
}

export function useChatbot() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const queryKey = ['chatbot', userId] as const;

  const query = useQuery<Chatbot | null, Error>({
    queryKey,
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    queryFn: async () => {
      if (!userId) return null;
      const { data: existing, error: fetchError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (fetchError) throw fetchError;
      if (existing) return existing as Chatbot;

      const { data: created, error: createError } = await supabase
        .from('chatbots')
        .insert({ user_id: userId, name: 'شات بوت جديد' })
        .select()
        .single();
      if (createError) throw createError;
      return created as Chatbot;
    },
  });

  const refetch = useCallback(async () => {
    const res = await query.refetch();
    return res.data ?? null;
  }, [query]);

  const updateChatbot = useCallback(
    async (updates: Partial<Chatbot>) => {
      let target = query.data;
      if (!target) {
        target = (await query.refetch()).data ?? null;
      }
      if (!target) {
        return { success: false, error: new Error('chatbot_not_loaded') };
      }
      try {
        const { data, error } = await supabase
          .from('chatbots')
          .update(updates)
          .eq('id', target.id)
          .select()
          .single();
        if (error) throw error;
        queryClient.setQueryData(queryKey, data as Chatbot);
        return { success: true };
      } catch (err) {
        console.error('Error updating chatbot:', err);
        return { success: false, error: err as Error };
      }
    },
    [query, queryClient, queryKey]
  );

  return {
    chatbot: query.data ?? null,
    loading: !!userId && query.isLoading,
    error: query.error ? query.error.message : null,
    updateChatbot,
    refetch,
  };
}
