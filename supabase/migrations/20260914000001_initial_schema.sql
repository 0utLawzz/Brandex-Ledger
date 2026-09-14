-- ============================================================
-- BRANDEX LAW ASSOCIATES - LEDGER SYSTEM
-- Migration: 001 - Initial Schema
-- ============================================================

-- TABLE: clients
CREATE TABLE IF NOT EXISTS public.clients (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_code     text UNIQUE NOT NULL,
  client_name     text,
  city            text,
  header_balance  numeric DEFAULT 0,
  bank_name       text,
  bank_account    text,
  bank_iban       text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

COMMENT ON TABLE public.clients IS 'One row per client account. client_code matches the Excel sheet name.';
COMMENT ON COLUMN public.clients.header_balance IS 'Opening/prior balance shown in the header rows of the original ledger sheet.';

-- TABLE: ledger_entries
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_code      text NOT NULL REFERENCES public.clients(client_code) ON DELETE CASCADE,
  entry_date       date,
  folder_no        text,
  stage            text,
  tm_no            text,
  details          text,
  amount_due       numeric,
  amount_received  numeric,
  running_balance  numeric,
  entry_type       text GENERATED ALWAYS AS (
                     CASE
                       WHEN amount_received IS NOT NULL AND amount_due IS NULL THEN 'payment'
                       ELSE 'case'
                     END
                   ) STORED,
  created_at       timestamptz DEFAULT now()
);

COMMENT ON TABLE public.ledger_entries IS 'Every ledger row - both case charges and payment receipts.';
COMMENT ON COLUMN public.ledger_entries.tm_no IS 'TM registration number e.g. TM-48. NULL on payment rows.';
COMMENT ON COLUMN public.ledger_entries.entry_type IS 'Auto-derived: payment if amount_received is set, otherwise case.';

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ledger_entries_client_code ON public.ledger_entries(client_code);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_date ON public.ledger_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entry_type ON public.ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tm_no ON public.ledger_entries(tm_no) WHERE tm_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON public.clients(client_code);

-- UPDATED_AT trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $body$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Public read ledger_entries" ON public.ledger_entries FOR SELECT USING (true);
CREATE POLICY "Service role full access clients" ON public.clients FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ledger_entries" ON public.ledger_entries FOR ALL USING (auth.role() = 'service_role');

-- HELPER VIEW
CREATE OR REPLACE VIEW public.client_balances AS
SELECT
  c.client_code,
  c.client_name,
  c.city,
  c.header_balance,
  COALESCE(SUM(e.amount_due), 0)      AS total_due,
  COALESCE(SUM(e.amount_received), 0) AS total_received,
  COALESCE(SUM(e.amount_due), 0) - COALESCE(SUM(e.amount_received), 0) AS current_balance,
  COUNT(e.id) AS entry_count
FROM public.clients c
LEFT JOIN public.ledger_entries e ON e.client_code = c.client_code
GROUP BY c.client_code, c.client_name, c.city, c.header_balance
ORDER BY c.client_code;

COMMENT ON VIEW public.client_balances IS 'Aggregated financials per client for dashboard stat cards.';
