import pandas as pd
import json
from datetime import datetime
import string
import random
import sys

# Set UTF-8 encoding for output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

def generate_id():
    timestamp_part = hex(int(datetime.now().timestamp() * 1000))[2:]
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return timestamp_part + random_part

def parse_date(date_val):
    """Parse Excel date to YYYY-MM-DD format"""
    if pd.isna(date_val):
        return ""
    
    if isinstance(date_val, datetime):
        return date_val.strftime("%Y-%m-%d")
    
    if isinstance(date_val, str):
        try:
            dt = pd.to_datetime(date_val)
            return dt.strftime("%Y-%m-%d")
        except:
            return ""
    
    try:
        dt = pd.to_datetime(date_val, unit='D', origin='1899-12-30')
        return dt.strftime("%Y-%m-%d")
    except:
        return ""

def process_client_sheet(sheet_name, client_name):
    """Extract ledger entries from a client's individual sheet"""
    try:
        print(f"  Processing sheet: {sheet_name}")
        df = pd.read_excel('Ledger (CONSULTANTS).xlsx', sheet_name=sheet_name, header=None)
        
        # Find the header row
        header_row = None
        for i in range(min(20, len(df))):
            row_vals = [str(df.iloc[i, col]).upper() if pd.notna(df.iloc[i, col]) else "" for col in df.columns]
            if "DATE" in row_vals and "DETAILS" in row_vals:
                header_row = i
                break
        
        if header_row is None:
            print(f"  Warning: Could not find header row")
            return []
        
        # Get column indices
        date_col = folder_col = stage_col = tm_col = details_col = due_col = received_col = None
        
        for col in df.columns:
            val = str(df.iloc[header_row, col]).upper() if pd.notna(df.iloc[header_row, col]) else ""
            if "DATE" in val:
                date_col = col
            elif "FOLDER" in val:
                folder_col = col
            elif "STAGE" in val:
                stage_col = col
            elif "TM" in val and "NO" in val:
                tm_col = col
            elif "DETAILS" in val:
                details_col = col
            elif "DUE" in val:
                due_col = col
            elif "RECEIVED" in val:
                received_col = col
        
        entries = []
        
        # Process all data rows
        for i in range(header_row + 1, len(df)):
            row = df.iloc[i]
            
            # Skip completely empty rows
            if all(pd.isna(row[col]) for col in df.columns):
                continue
            
            # Extract values
            date_val = parse_date(row[date_col]) if date_col is not None else ""
            folder_no = str(row[folder_col]).strip() if folder_col is not None and pd.notna(row[folder_col]) else ""
            stage = str(row[stage_col]).strip().upper() if stage_col is not None and pd.notna(row[stage_col]) else ""
            tm_no = str(row[tm_col]).strip() if tm_col is not None and pd.notna(row[tm_col]) else ""
            details = str(row[details_col]).strip() if details_col is not None and pd.notna(row[details_col]) else ""
            due = float(row[due_col]) if due_col is not None and pd.notna(row[due_col]) else 0
            received = float(row[received_col]) if received_col is not None and pd.notna(row[received_col]) else 0
            
            # Skip rows with no meaningful data
            if not details and not folder_no and due == 0 and received == 0:
                continue
            
            entry_type = "payment" if "PAYMENT" in details.upper() or received > 0 else "case"
            
            entry = {
                "id": generate_id(),
                "type": entry_type,
                "folderNo": folder_no if folder_no else "",
                "date": date_val if date_val else datetime.now().strftime("%Y-%m-%d"),
                "stage": stage if stage else "S1",
                "tmNo": tm_no,
                "details": details if details else "Imported Entry",
                "due": due,
                "received": received,
                "createdAt": datetime.now().isoformat()
            }
            
            entries.append(entry)
        
        print(f"  Total entries found: {len(entries)}")
        return entries
        
    except Exception as e:
        print(f"  Error: {str(e)}")
        return []

def process_excel():
    # Get client list from Dashboard sheet
    dashboard_df = pd.read_excel('Ledger (CONSULTANTS).xlsx', sheet_name='Dashboard', header=1)
    
    # Get all sheet names
    excel_file = pd.ExcelFile('Ledger (CONSULTANTS).xlsx')
    sheet_names = excel_file.sheet_names
    
    clients = []
    processed_count = 0
    skipped_count = 0
    
    print("Processing all clients...")
    
    # Process all clients
    for index, row in dashboard_df.iterrows():
            
        ledger_no = row.get('LEDGER NO')
        name = row.get('NAME')
        
        if pd.isna(ledger_no) or pd.isna(name):
            skipped_count += 1
            continue
            
        ledger_no = str(ledger_no).strip()
        name = str(name).strip()
        
        if not ledger_no or not name or ledger_no.lower() == 'nan' or name.lower() == 'nan':
            skipped_count += 1
            continue
        
        print(f"\nClient {processed_count+1}: {ledger_no} - {name}")
        
        # Check if there's a corresponding sheet for this client
        if ledger_no in sheet_names:
            entries = process_client_sheet(ledger_no, name)
        else:
            print(f"  No sheet found, using opening balance")
            # Fall back to opening balance from Dashboard
            balance = row.get('BALANCE')
            due_amount = 0
            if not pd.isna(balance):
                try:
                    due_amount = float(balance)
                except ValueError:
                    due_amount = 0
            
            entries = []
            if due_amount > 0:
                entries.append({
                    "id": generate_id(),
                    "type": "case",
                    "folderNo": "Opening",
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "stage": "S1",
                    "tmNo": "",
                    "details": "Opening Balance (Imported from Dashboard)",
                    "due": due_amount,
                    "received": 0,
                    "createdAt": datetime.now().isoformat()
                })
        
        client_id = generate_id()
        client = {
            "id": client_id,
            "accNo": ledger_no,
            "name": name,
            "city": "",
            "phone": "",
            "notes": "Imported from Ledger (CONSULTANTS).xlsx with complete ledger entries",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "entries": entries,
            "createdAt": datetime.now().isoformat()
        }
        clients.append(client)
        processed_count += 1
    
    print(f"\n" + "="*50)
    print(f"Complete Import Summary:")
    print(f"Successfully processed: {processed_count} clients")
    print(f"Skipped: {skipped_count} invalid entries")
    print(f"Total entries extracted: {sum(len(c['entries']) for c in clients)}")
    print(f"="*50)
        
    backup_data = {
        "clients": clients,
        "actLog": [{"type": "sys", "msg": f"Complete import of {processed_count} clients with full ledger entries", "ts": datetime.now().isoformat()}],
        "settings": {"s1": 9000, "s2": 10000, "s3": 10500, "s4": 15000, "prefix": "A"},
        "version": "2.0",
        "exportedAt": datetime.now().isoformat()
    }
    
    with open('backup.json', 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
    print(f"Complete data saved to backup.json")

if __name__ == "__main__":
    process_excel()
