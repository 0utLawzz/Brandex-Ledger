import pandas as pd
import json

# Read Excel file
df = pd.read_excel('Ledger (CONSULTANTS).xlsx', header=1)
print(f"Total rows in Excel: {len(df)}")

# Count valid rows
valid = df[df['LEDGER NO'].notna() & df['NAME'].notna()]
print(f"Valid rows (non-null LEDGER NO and NAME): {len(valid)}")

print("\nAll valid entries from Excel:")
for idx, row in valid.iterrows():
    print(f"Row {idx}: {row['LEDGER NO']} - {row['NAME']} - Balance: {row['BALANCE']}")

# Read backup.json
with open('backup.json', 'r') as f:
    backup = json.load(f)

print(f"\nTotal clients in backup.json: {len(backup['clients'])}")
print("\nClients from backup.json:")
for client in backup['clients']:
    balance = sum(e['due'] - e['received'] for e in client['entries'])
    print(f"{client['accNo']}: {client['name']} - Entries: {len(client['entries'])} - Balance: {balance}")
