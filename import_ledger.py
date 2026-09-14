import openpyxl
import json
from datetime import datetime, date
import string
import random
import sys

sys.stdout.reconfigure(encoding='utf-8')

def generate_id():
    timestamp_part = hex(int(datetime.now().timestamp() * 1000))[2:]
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return timestamp_part + random_part

def clean_val(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()

def clean_num(v):
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    try:
        s = str(v).replace(',', '').replace('PKR', '').replace('pkr', '').replace(' ', '').strip()
        if not s or s == '-':
            return 0.0
        return float(s)
    except:
        return 0.0

def parse_date(v):
    if v is None:
        return ""
    if isinstance(v, (datetime, date)):
        return v.strftime("%Y-%m-%d")
    s = str(v).strip()
    if not s or s.lower() == 'none' or s.lower() == 'nan':
        return ""
    for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%d.%m.%Y", "%Y.%m.%d", "%d-%b-%Y", "%d-%b-%y"]:
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except:
            continue
    return s[:10]

def parse_sheet_entries(ws, sheet_name):
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    
    # Locate header row
    header_idx = None
    for idx, row in enumerate(rows[:10]):
        row_str = [str(c).upper() for c in row if c is not None]
        if any('DATE' in c for c in row_str) and (any('DETAIL' in c for c in row_str) or any('DUE' in c for c in row_str) or any('RECEIVED' in c for c in row_str)):
            header_idx = idx
            break
            
    if header_idx is None:
        if len(rows) > 3:
            header_idx = 3
        else:
            return []

    header = [str(c).upper().strip() if c is not None else "" for c in rows[header_idx]]
    
    date_col = 0
    folder_col = 1
    stage_col = 2
    tm_col = 3
    details_col = 4
    due_col = 5
    received_col = 6
    
    for i, col_name in enumerate(header):
        if 'DATE' in col_name:
            date_col = i
        elif 'FOLDER' in col_name:
            folder_col = i
        elif 'STAGE' in col_name:
            stage_col = i
        elif 'TM' in col_name:
            tm_col = i
        elif 'DETAIL' in col_name:
            details_col = i
        elif 'DUE' in col_name:
            due_col = i
        elif 'REC' in col_name:
            received_col = i

    entries = []
    for row in rows[header_idx + 1:]:
        if not any(c is not None for c in row):
            continue
            
        def get_col(idx):
            return row[idx] if idx < len(row) else None

        d_val = parse_date(get_col(date_col))
        folder_val = clean_val(get_col(folder_col))
        stage_val = clean_val(get_col(stage_col)).upper()
        tm_val = clean_val(get_col(tm_col))
        details_val = clean_val(get_col(details_col))
        due_val = clean_num(get_col(due_col))
        rec_val = clean_num(get_col(received_col))
        
        # Check if row is meaningful
        if not details_val and not folder_val and not tm_val and due_val == 0 and rec_val == 0:
            continue
            
        # Filter out total footer row
        if ('TOTAL' in details_val.upper() or 'BALANCE' in details_val.upper()) and (due_val == 0 and rec_val == 0 or not d_val):
            continue
            
        entry_type = "payment" if rec_val > 0 or "PAYMENT" in details_val.upper() or "REC" in details_val.upper() else "case"
        
        entry = {
            "id": generate_id(),
            "type": entry_type,
            "folderNo": folder_val,
            "date": d_val if d_val else datetime.now().strftime("%Y-%m-%d"),
            "stage": stage_val if stage_val in ["S1", "S2", "S3", "S4"] else (stage_val if stage_val else "S1"),
            "tmNo": tm_val,
            "details": details_val if details_val else ("Payment Received" if entry_type == "payment" else "Case Entry"),
            "due": due_val,
            "received": rec_val,
            "createdAt": datetime.now().isoformat()
        }
        entries.append(entry)
        
    return entries

def main():
    print("Opening Ledger (CONSULTANTS).xlsx ...")
    wb = openpyxl.load_workbook('Ledger (CONSULTANTS).xlsx', data_only=True)
    
    # 1. Read Dashboard clients
    dashboard_ws = wb['Dashboard']
    dash_rows = list(dashboard_ws.iter_rows(values_only=True))
    
    client_dict = {}
    for row in dash_rows[2:]:
        if not row or len(row) < 4:
            continue
        acc_no = clean_val(row[1])
        name = clean_val(row[2])
        balance = clean_num(row[3])
        
        if acc_no and acc_no.startswith(('A-', 'X-', 'B-')) and name and name.upper() != 'NAME':
            if acc_no not in client_dict:
                client_dict[acc_no] = {
                    "accNo": acc_no,
                    "name": name,
                    "expected_balance": balance
                }
                
    # Also add any sheets that might not be in Dashboard
    for s in wb.sheetnames:
        if s not in ['Dashboard', '__COLOR_REF__'] and s not in client_dict:
            client_dict[s] = {
                "accNo": s,
                "name": f"Client {s}",
                "expected_balance": 0.0
            }
            
    print(f"Total Unique Clients to process: {len(client_dict)}")
    
    all_clients = []
    total_entries_count = 0
    total_balance_sum = 0.0
    
    blacklist_words = ['FOLDER', 'DATE', 'STAGE', 'TM', 'DETAIL', 'DUE', 'REC', 'BALANCE', 'LEDGER', 'HOME', 'OFFICE', 'BANK', 'TITLE', 'STATEMENT', 'PKR', 'PAGE', 'BRANDEX']
    
    for acc, c in client_dict.items():
        name = c['name']
        entries = []
        
        if acc in wb.sheetnames:
            ws = wb[acc]
            entries = parse_sheet_entries(ws, acc)
            
            # If name is generic or missing, check sheet header
            if not name or name.startswith("Client ") or name.upper() in blacklist_words:
                header_rows = list(ws.iter_rows(values_only=True))[:4]
                for hr in header_rows:
                    for cell in hr:
                        if cell is not None and isinstance(cell, str) and len(cell.strip()) > 2:
                            cell_clean = cell.strip()
                            if cell_clean != acc and not any(w in cell_clean.upper() for w in blacklist_words):
                                name = cell_clean
                                break
                                
        if not entries and c['expected_balance'] != 0:
            entries.append({
                "id": generate_id(),
                "type": "case",
                "folderNo": "Opening",
                "date": datetime.now().strftime("%Y-%m-%d"),
                "stage": "S1",
                "tmNo": "",
                "details": "Opening Balance",
                "due": max(0.0, c['expected_balance']),
                "received": max(0.0, -c['expected_balance']) if c['expected_balance'] < 0 else 0.0,
                "createdAt": datetime.now().isoformat()
            })
            
        client_due = sum(e['due'] for e in entries)
        client_rec = sum(e['received'] for e in entries)
        client_bal = client_due - client_rec
        total_balance_sum += client_bal
        total_entries_count += len(entries)
        
        all_clients.append({
            "id": generate_id(),
            "accNo": acc,
            "name": name,
            "city": "",
            "phone": "",
            "notes": f"Ledger account {acc} with {len(entries)} entries",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "entries": entries,
            "createdAt": datetime.now().isoformat()
        })
        print(f"[{acc}] {name}: {len(entries)} entries | Due: PKR {client_due:,.0f} | Rec: PKR {client_rec:,.0f} | Bal: PKR {client_bal:,.0f}")

    print("="*60)
    print(f"Total Clients Imported: {len(all_clients)}")
    print(f"Total Entries Imported: {total_entries_count}")
    print(f"Total Portfolio Balance: PKR {total_balance_sum:,.2f}")
    print("="*60)
    
    backup_data = {
        "clients": all_clients,
        "actLog": [
            {
                "type": "sys",
                "msg": f"Full Ledger Import: {len(all_clients)} client accounts and {total_entries_count} entries successfully imported from Excel ledger.",
                "ts": datetime.now().isoformat()
            }
        ],
        "settings": {
            "s1": 9000,
            "s2": 10000,
            "s3": 10500,
            "s4": 15000,
            "prefix": "A"
        },
        "version": "2.0",
        "exportedAt": datetime.now().isoformat()
    }
    
    with open('backup.json', 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    print("Saved complete data to backup.json")
    
    with open('initial_data.js', 'w', encoding='utf-8') as f:
        f.write("// Brandex Ledger Initial Seed Data\n")
        f.write("const defaultData = ")
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print("Saved complete data to initial_data.js")

if __name__ == '__main__':
    main()
