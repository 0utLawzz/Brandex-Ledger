import pandas as pd
import json
import math
from datetime import datetime
import string
import random

def generate_id():
    # Similar to the JS ts() function: Date.now().toString(36) + Math.random().toString(36).slice(2,6)
    timestamp_part = hex(int(datetime.now().timestamp() * 1000))[2:]
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return timestamp_part + random_part

def process_excel():
    df = pd.read_excel('Ledger (CONSULTANTS).xlsx', header=1) # The actual headers are probably on row 2 (index 1)
    
    clients = []
    skipped_count = 0
    
    for index, row in df.iterrows():
        ledger_no = row.get('LEDGER NO')
        name = row.get('NAME')
        balance = row.get('BALANCE')
        
        # Skip rows where LEDGER NO or NAME is missing/empty
        if pd.isna(ledger_no) or pd.isna(name):
            skipped_count += 1
            continue
            
        ledger_no = str(ledger_no).strip()
        name = str(name).strip()
        
        # Skip empty strings after stripping
        if not ledger_no or not name or ledger_no.lower() == 'nan' or name.lower() == 'nan':
            skipped_count += 1
            continue
            
        due_amount = 0
        if not pd.isna(balance):
            try:
                due_amount = float(balance)
            except ValueError:
                due_amount = 0
                
        client_id = generate_id()
        entries = []
        if due_amount > 0:
            entries.append({
                "id": generate_id(),
                "type": "case",
                "folderNo": "Opening",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "stage": "S1",
                "tmNo": "",
                "details": "Opening Balance (Imported)",
                "due": due_amount,
                "received": 0,
                "createdAt": datetime.now().isoformat()
            })
            
        client = {
            "id": client_id,
            "accNo": ledger_no,
            "name": name,
            "city": "",
            "phone": "",
            "notes": "Imported from Ledger (CONSULTANTS).xlsx",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "entries": entries,
            "createdAt": datetime.now().isoformat()
        }
        clients.append(client)
            
    print(f"Processing complete. Skipped {skipped_count} rows with missing/empty data.")
    print(f"Total valid clients imported: {len(clients)}")
        
    backup_data = {
        "clients": clients,
        "actLog": [{"type": "sys", "msg": f"Imported {len(clients)} clients from Excel (skipped {skipped_count} invalid rows)", "ts": datetime.now().isoformat()}],
        "settings": {"s1": 9000, "s2": 10000, "s3": 10500, "s4": 15000, "prefix": "A"},
        "version": "2.0",
        "exportedAt": datetime.now().isoformat()
    }
    
    with open('backup.json', 'w') as f:
        json.dump(backup_data, f, indent=2)
        
    print(f"Successfully exported {len(clients)} clients to backup.json")

if __name__ == "__main__":
    process_excel()
