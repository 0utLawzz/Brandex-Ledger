-- This is an internal, browser-only ledger with no authentication layer.
-- The frontend performs these actions with the project's anon key, so RLS
-- must explicitly permit the operations offered by the interface.

CREATE POLICY "Public create clients"
  ON public.clients
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public edit clients"
  ON public.clients
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete clients"
  ON public.clients
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Public create ledger entries"
  ON public.ledger_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public delete ledger entries"
  ON public.ledger_entries
  FOR DELETE
  TO anon
  USING (true);

GRANT INSERT, UPDATE, DELETE ON TABLE public.clients TO anon;
GRANT INSERT, DELETE ON TABLE public.ledger_entries TO anon;
