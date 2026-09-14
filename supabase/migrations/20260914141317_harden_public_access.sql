-- Keep the browser-facing ledger read-only while explicitly exposing it
-- through the Data API. New Supabase projects no longer expose public tables
-- automatically, so these grants are intentional rather than incidental.

DROP POLICY IF EXISTS "Public read clients" ON public.clients;
DROP POLICY IF EXISTS "Public read ledger_entries" ON public.ledger_entries;
DROP POLICY IF EXISTS "Service role full access clients" ON public.clients;
DROP POLICY IF EXISTS "Service role full access ledger_entries" ON public.ledger_entries;

CREATE POLICY "Public read clients"
  ON public.clients
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read ledger_entries"
  ON public.ledger_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON TABLE public.clients, public.ledger_entries FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.clients, public.ledger_entries TO anon, authenticated;

-- Views are security-definer by default. This aggregation must honor the
-- caller's permissions and RLS if it is ever exposed through the Data API.
ALTER VIEW public.client_balances SET (security_invoker = true);

-- The function is only invoked by the table trigger. Pin its search path and
-- remove direct execution from public API roles.
ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
