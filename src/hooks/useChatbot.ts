import { useCallback, useEffect, useState } from 'react';
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
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrCreateChatbot = useCallback(async () => {
    if (!user) {
      setChatbot(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: existingChatbot, error: fetchError } = await supabase
        .from('chatbots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (fetchError) throw fetchError;

      if (existingChatbot) {
        setChatbot(existingChatbot);
        return existingChatbot as Chatbot;
      }

      const { data: newChatbot, error: createError } = await supabase
        .from('chatbots')
        .insert({ user_id: user.id, name: 'شات بوت جديد' })
        .select()
        .single();
      if (createError) throw createError;
      setChatbot(newChatbot);
      return newChatbot as Chatbot;
    } catch (err: any) {
      console.error('Error fetching/creating chatbot:', err);
      setError(err?.message || 'حدث خطأ في تحميل الشات بوت');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrCreateChatbot();
  }, [fetchOrCreateChatbot]);

  const updateChatbot = async (updates: Partial<Chatbot>) => {
    let target = chatbot;
    if (!target) {
      // Try to (re)load the chatbot on-demand instead of failing outright
      target = await fetchOrCreateChatbot();
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

      setChatbot(data);
      return { success: true };
    } catch (err) {
      console.error('Error updating chatbot:', err);
      return { success: false, error: err as Error };
    }
  };

  return { chatbot, loading, error, updateChatbot, refetch: fetchOrCreateChatbot };
}
