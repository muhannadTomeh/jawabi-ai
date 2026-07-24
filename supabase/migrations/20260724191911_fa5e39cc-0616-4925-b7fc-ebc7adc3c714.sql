DROP POLICY IF EXISTS "Users can delete their own connections" ON public.social_connections;
CREATE POLICY "Users can delete their own connections" ON public.social_connections
FOR DELETE TO authenticated
USING (auth.uid() = user_id AND public.is_chatbot_owner(chatbot_id));