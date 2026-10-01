-- ====================================================================
-- ROMÉO MEUBLE — Architecture Base de Données Supabase (PostgreSQL)
-- Menuiserie & Tapisserie — Nkoabang, Yaoundé, Cameroun
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE ENTREPRISES (COMPANIES / MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'ROMÉO MEUBLE',
  activity TEXT NOT NULL DEFAULT 'Menuiserie & Tapisserie',
  manager_name TEXT NOT NULL DEFAULT 'Mouaffo Roméo',
  phone_primary TEXT NOT NULL DEFAULT '+237 688 757 194',
  phone_secondary TEXT NOT NULL DEFAULT '+237 698 833 019',
  address TEXT NOT NULL DEFAULT 'Nkoabang, Yaoundé, Cameroun',
  city TEXT NOT NULL DEFAULT 'Yaoundé',
  country TEXT NOT NULL DEFAULT 'Cameroun',
  email TEXT DEFAULT 'contact@romeo-meuble.cm',
  currency TEXT NOT NULL DEFAULT 'FCFA',
  logo_url TEXT,
  signature_url TEXT,
  stamp_url TEXT,
  show_stamp_on_quotes BOOLEAN DEFAULT TRUE,
  default_terms TEXT DEFAULT 'Ce devis est établi selon les dimensions, matériaux, tissus et finitions convenus avec le client. La fabrication commence dès validation du devis et encaissement de l''acompte convenu. Les délais d''exécution courent à compter de la réception de l''acompte.',
  default_whatsapp_message TEXT DEFAULT 'Bonjour {client_name},\n\nVotre devis ROMÉO MEUBLE N° {quote_number} est disponible.\nMontant total : {total_amount} FCFA.\nAcompte demandé : {deposit_amount} FCFA.\n\nVous trouverez le devis PDF complet ci-joint.\n\nMerci pour votre confiance.\n\nROMÉO MEUBLE\nMenuiserie & Tapisserie\nWhatsApp : +237 688 757 194',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE UTILISATEURS / PROFILS (USERS)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

-- 5. TABLE DEVIS (QUOTES)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  quote_number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  validity_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoye', 'en_attente', 'accepte', 'refuse', 'expire')),
  
  -- Données client copiées pour l'archivage fidèle
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_email TEXT,

  -- Détails du projet / travaux
  project_object TEXT NOT NULL DEFAULT 'Devis de finition bâtiment',
  project_description TEXT,
  execution_location TEXT,
  estimated_duration TEXT,

  -- Montants financiers en FCFA
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'percent', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deposit_requested NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,

  notes TEXT,
  terms_and_conditions TEXT NOT NULL,
  include_stamp BOOLEAN DEFAULT TRUE,
  converted_to_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_quote_number_per_company UNIQUE (company_id, quote_number)
);

CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON public.quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

-- 6. TABLE ARTICLES / LIGNES DE DEVIS (QUOTE_ITEMS)
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'U',
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);

-- 7. TABLE COMMANDES (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  quote_number TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  client_address TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'a_realiser' CHECK (status IN ('a_realiser', 'en_fabrication', 'en_finition', 'prete', 'livree', 'terminee')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deposit_requested NUMERIC(12, 2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_order_number_per_company UNIQUE (company_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_company_id ON public.orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 8. TABLE PAIEMENTS (PAYMENTS)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('especes', 'mobile_money_mtn', 'mobile_money_orange', 'virement', 'autre')),
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON public.payments(company_id);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function: get user company id
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS policies for each table
CREATE POLICY "Companies isolation" ON public.companies
  FOR ALL USING (id = public.get_current_user_company_id());

CREATE POLICY "Clients isolation" ON public.clients
  FOR ALL USING (company_id = public.get_current_user_company_id());

CREATE POLICY "Quotes isolation" ON public.quotes
  FOR ALL USING (company_id = public.get_current_user_company_id());

CREATE POLICY "Quote Items isolation" ON public.quote_items
  FOR ALL USING (
    quote_id IN (SELECT id FROM public.quotes WHERE company_id = public.get_current_user_company_id())
  );

CREATE POLICY "Orders isolation" ON public.orders
  FOR ALL USING (company_id = public.get_current_user_company_id());

CREATE POLICY "Payments isolation" ON public.payments
  FOR ALL USING (company_id = public.get_current_user_company_id());

-- 10. SUPABASE STORAGE (LOGOS, CACHETS & SIGNATURES MULTI-TENANT)
-- Bucket public ou sécurisé pour les ressources visuelles de l'entreprise
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS sur les fichiers du stockage Supabase (Isolé par company_id dans le chemin: [company_id]/stamps/...)
CREATE POLICY "Company Assets Access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'company-assets' 
    AND (storage.foldername(name))[1] = public.get_current_user_company_id()::text
  );
