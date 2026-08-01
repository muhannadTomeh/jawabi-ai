CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  messages_per_day integer NOT NULL DEFAULT 300,
  messages_per_minute_per_chatbot integer NOT NULL DEFAULT 60,
  max_channels integer NOT NULL DEFAULT 4,
  max_knowledge_items integer DEFAULT NULL,
  allowed_model text DEFAULT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins can insert plans" ON public.plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update plans" ON public.plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete plans" ON public.plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- only one default plan
CREATE UNIQUE INDEX plans_single_default_idx ON public.plans (is_default) WHERE is_default;

INSERT INTO public.plans (name, slug, price_monthly, messages_per_day, messages_per_minute_per_chatbot, max_channels, max_knowledge_items, allowed_model, is_default)
VALUES ('مجاني', 'free', 0, 300, 60, 4, NULL, NULL, true);

-- link chatbots to a plan
ALTER TABLE public.chatbots ADD COLUMN plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;
UPDATE public.chatbots SET plan_id = (SELECT id FROM public.plans WHERE is_default LIMIT 1);