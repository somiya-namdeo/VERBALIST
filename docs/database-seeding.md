# Database Seeding Strategy

## 1. Source Data
The seeding script targets `data/processed/products_cleaned.csv`, which contains mathematically validated, normalized catalog items representing general grocery products without user-specific state.

## 2. Target Table
Target: `products` (PostgreSQL/Supabase). 
The `id`, `created_at`, and `updated_at` fields are omitted during insertion, deliberately relying on PostgreSQL default functions (`gen_random_uuid()` and `now()`) to generate them cleanly upon import.

## 3. Required Environment Variables
The script operates as a backend administrative utility and requires two environment variables defined in `backend/.env`:
- `SUPABASE_URL`: The API URL of the Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: The administrative key capable of bypassing Row Level Security (RLS) to perform bulk inserts.

*Security Warning*: `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to browser clients, repositories, or frontend code. It grants full administrative write access to the database.

## 4. Execution
The script must be run from the repository root:
```bash
python backend/scripts/seed_products.py
```

## 5. Idempotency Strategy
The initial products schema does not enforce unique external dataset IDs. To prevent silent, accidental duplication of 24,000+ rows upon repeated runs:
- The script actively queries the `products` table *before* inserting data.
- If **any** rows currently exist in the table, the script safely **aborts** execution with a clear warning.
- To execute a fresh seed, administrators must manually truncate or clear the existing rows first.

## 6. Null Handling & Batching
- Pandas `NaN` and `NaT` artifacts are aggressively converted into native Python `None` values prior to insertion, guaranteeing proper standard `NULL` values in PostgreSQL instead of corrupted string literals (e.g. `"NaN"`).
- Insertions are chunked in `batch_size = 500` to prevent payload limitations or memory exhaustion over the HTTP REST API.

## 7. Post-Insertion Verification
After the batch inserts finish, the script independently queries the database to report:
- Total inserted product count
- Products with valid prices
- Products marked `is_on_sale`
- Products marked `is_organic`
