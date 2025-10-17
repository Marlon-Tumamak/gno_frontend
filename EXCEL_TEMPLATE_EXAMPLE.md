# Excel Template for Repair and Maintenance Upload

## Required Columns

Your Excel file should have these exact column names (case-sensitive):

| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| `account_number` | Text | Account number | "ACC-001" |
| `truck_type` | Text | Truck type name | "trailer" or "forward" |
| `account_type` | Text | Account type | "repairs and maintenance expense" |
| `plate_number` | Text | Plate number | "KGJ 765" |
| `debit` | Number | Debit amount | 1500.00 |
| `credit` | Number | Credit amount | 0.00 |
| `final_total` | Number | Final total amount | 1500.00 |
| `reference_number` | Text | Reference number | "REF-12345" |
| `date` | Date | Transaction date | 2024-01-15 (YYYY-MM-DD) |
| `description` | Text | Description | "Engine repair" |
| `remarks` | Text | Remarks | "Scheduled maintenance" |

## Sample Excel Data

| account_number | truck_type | account_type | plate_number | debit | credit | final_total | reference_number | date | description | remarks |
|---------------|------------|--------------|--------------|-------|--------|-------------|-----------------|------|-------------|---------|
| ACC-001 | trailer | repairs and maintenance expense | KGJ 765 | 1500.00 | 0.00 | 1500.00 | REF-001 | 2024-01-15 | Brake repair | Routine maintenance |
| ACC-002 | forward | repairs and maintenance expense | KGJ 765 | 2500.00 | 0.00 | 2500.00 | REF-002 | 2024-01-16 | Engine service | Scheduled service |

## Notes

- The system will automatically create new truck types, account types, and plate numbers if they don't exist in the database
- Date format should be YYYY-MM-DD (e.g., 2024-01-15)
- Numeric fields (debit, credit, final_total) should be numbers without currency symbols
- All text fields should be plain text without special formatting

