-- Fix function permissions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_chatbot_owner(uuid) TO authenticated, service_role;

-- Fix table permissions for all public tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Add anonymous select for public tables if needed (e.g., plans, chatbots, knowledge_items for public widget)
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.chatbots TO anon;
GRANT SELECT ON public.knowledge_items TO anon;

-- Cleanup: Truncate all tables to remove development seed data
TRUNCATE TABLE 
    public.user_roles, 
    public.profiles, 
    public.chatbots, 
    public.knowledge_items, 
    public.channels, 
    public.handover_settings, 
    public.telegram_users, 
    public.telegram_messages, 
    public.whatsapp_contacts, 
    public.whatsapp_messages, 
    public.web_chat_messages, 
    public.social_connections, 
    public.notifications, 
    public.customers, 
    public.messenger_messages, 
    public.messenger_users, 
    public.llm_settings, 
    public.conversation_takeovers, 
    public.pending_sale_orders, 
    public.conversation_locks, 
    public.admin_audit_log, 
    public.rate_limit_counters, 
    public.rate_limit_violations, 
    public.plans, 
    public.api_providers, 
    public.api_provider_models 
CASCADE;
