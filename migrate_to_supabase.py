"""
migrate_to_supabase.py
Reads new_data_unzipped/ledger_all_clients.json and seeds the Supabase
clients + ledger_entries tables.

Usage:
  1. Copy .env.example to .env and fill in your keys
  2. pip install supabase python-dotenv
  3. python migrate_to_supabase.py
"""

import json, os, re, sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase package not found. Run: pip install supabase")
    sys.exit(1)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sygfnemgebuhtqpmedbg.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
DATA_FILE = Path(__file__).parent / "new_data_unzipped" / "ledger_all_clients.json"
BATCH_SIZE = 100

if not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_KEY not set. Create a .env file from .env.example")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def extract_bank_info(header_rows):
    bank_name = bank_account = bank_iban = None
    for row_data in (header_rows or {}).values():
        if not isinstance(row_data, list):
            continue
        for cell in row_data:
            if not isinstance(cell, str):
                continue
            cu = cell.upper()
            if "BANK NAME" in cu and not bank_name:
                m = re.search(r'BANK NAME\s*[:]+\s*(.+)', cu)
                if m: bank_name = m.group(1).strip()
            if not bank_iban:
                m = re.search(r'IBAN[#\s:]*([A-Z0-9]{15,34})', cu)
                if m: bank_iban = m.group(1).strip()
            if not bank_account:
                m = re.search(r'(?:AC NO\.?|A/C)\s*([\d\-]+)', cu)
                if m: bank_account = m.group(1).strip()
    return bank_name, bank_account, bank_iban


def parse_row(row, client_code):
    if not isinstance(row, list) or len(row) < 7:
        return None
    entry_date      = row[0] if row[0] else None
    folder_no       = str(row[1]).strip() if row[1] is not None else None
    stage           = str(row[2]).strip().upper() if row[2] else None
    tm_no           = str(row[3]).strip() if row[3] and str(row[3]).strip() not in ("", " ") else None
    details         = str(row[4]).strip() if row[4] else None
    amount_due      = float(row[5]) if row[5] is not None else None
    amount_received = float(row[6]) if row[6] is not None else None
    running_balance = float(row[7]) if len(row) > 7 and row[7] is not None else None

    if not details and amount_due is None and amount_received is None:
        return None
    if folder_no in ("None", "null", ""): folder_no = None
    if tm_no in ("None", "null", " ", "None"): tm_no = None
    if stage not in ("S1", "S2", "S3", "S4"): stage = None

    return {
        "client_code": client_code, "entry_date": entry_date,
        "folder_no": folder_no, "stage": stage, "tm_no": tm_no,
        "details": details, "amount_due": amount_due,
        "amount_received": amount_received, "running_balance": running_balance,
    }


def main():
    print(f"Loading {DATA_FILE} ...")
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    print(f"Found {len(data)} client sheets.\n")

    clients_rows = []
    entries_rows = []

    for sheet_key, c in data.items():
        code = (c.get("client_code") or sheet_key).strip()
        name = (c.get("client_name") or "").strip() or None
        bank_name, bank_account, bank_iban = extract_bank_info(c.get("header_rows", {}))
        clients_rows.append({
            "client_code": code,
            "client_name": name,
            "header_balance": c.get("header_balance") or 0,
            "bank_name": bank_name,
            "bank_account": bank_account,
            "bank_iban": bank_iban,
        })
        for row in c.get("entries", []):
            parsed = parse_row(row, code)
            if parsed:
                entries_rows.append(parsed)

    print(f"Upserting {len(clients_rows)} clients ...")
    for i in range(0, len(clients_rows), BATCH_SIZE):
        chunk = clients_rows[i:i+BATCH_SIZE]
        supabase.table("clients").upsert(chunk, on_conflict="client_code").execute()
        print(f"  clients {i+1}-{i+len(chunk)}")

    print(f"\nInserting {len(entries_rows)} ledger entries ...")
    # Clear existing entries first to avoid duplicates on re-run
    print("  Clearing existing entries ...")
    supabase.table("ledger_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    for i in range(0, len(entries_rows), BATCH_SIZE):
        chunk = entries_rows[i:i+BATCH_SIZE]
        supabase.table("ledger_entries").insert(chunk).execute()
        print(f"  entries {i+1}-{i+len(chunk)}")

    print(f"\n=== DONE === clients: {len(clients_rows)}, entries: {len(entries_rows)}")

if __name__ == "__main__":
    main()
