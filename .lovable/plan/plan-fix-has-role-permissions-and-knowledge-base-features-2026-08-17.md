# Plan - Fix has_role Permissions and Knowledge Base Features

The user reported a `permission denied for function has_role` error and requested to fix non-functional features while removing seed data.

## User Requirements
- Fix `permission denied for function has_role`.
- Remove all seed/mock data (real data only).
- Ensure all features work correctly.

## Proposed Changes

### 1. Database & Security
- **Fix function permissions**: Add a migration to explicitly grant `EXECUTE` on `has_role` and `is_chatbot_owner` to `authenticated` and `service_role`. Although previously granted, they might have been lost or conflict with schema changes.
- **Fix table permissions**: Ensure all core tables (`user_roles`, `profiles`, `chatbots`, `knowledge_items`, `channels`, `handover_settings`) have proper `GRANT` statements to `authenticated` and `service_role`. Many early migrations missed these.
- **Remove mock data**: Truncate all tables to remove any remaining seed data from development.

### 2. Implementation details

#### Migration: `fix_permissions_and_cleanup.sql`
- `GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;`
- `GRANT EXECUTE ON FUNCTION public.is_chatbot_owner(uuid) TO authenticated, service_role;`
- `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;`
- `GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;`
- `TRUNCATE TABLE public.user_roles, public.profiles, public.chatbots, public.knowledge_items, public.channels, public.handover_settings, public.telegram_users, public.telegram_messages, public.whatsapp_contacts, public.whatsapp_messages, public.web_chat_messages, public.social_connections, public.notifications, public.customers, public.messenger_messages, public.messenger_users, public.llm_settings, public.conversation_takeovers, public.pending_sale_orders, public.conversation_locks, public.admin_audit_log, public.rate_limit_counters, public.rate_limit_violations, public.plans, public.api_providers, public.api_provider_models CASCADE;`

### 3. Verification
- Verify that the `permission denied` error disappears in the frontend when accessing protected routes.
- Confirm that the database is clean and only contains data created by real interactions.
