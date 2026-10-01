-- ============================================================
-- BRANDEX LEDGER v2 — SaaS Auth + Multi-tenant foundation
-- ============================================================

-- Organizations (tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  full_name   text,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  org_id      uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Optional: add org_id to existing tables for multi-tenant isolation
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.ledger_entries ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_org_id ON public.ledger_entries(org_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at for profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS for new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Organizations: members of the org can view
CREATE POLICY "Org members can view org"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- For now keep existing public read on clients/ledger so the app works
-- while you gradually migrate to org-scoped policies.
-- Later you can tighten to:
-- USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))

COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations (law firms)';
COMMENT ON TABLE public.profiles IS 'User profiles with role and org membership';
