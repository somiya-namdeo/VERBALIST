import os
import sys
import math
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    # 1. Load environment variables
    # Resolve paths deterministically based on script location
    SCRIPT_DIR = Path(__file__).resolve().parent
    BACKEND_DIR = SCRIPT_DIR.parent
    PROJECT_ROOT = BACKEND_DIR.parent
    
    env_path = BACKEND_DIR / '.env'
    load_dotenv(env_path)
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env")
        sys.exit(1)
        
    # 2. Connect to Supabase
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
    except Exception as e:
        print("ERROR: Failed to initialize Supabase client.")
        sys.exit(1)
        
    # 3. Idempotency Check
    print("Checking database state for idempotency...")
    try:
        # Check if products already exist to prevent duplicate seeding
        existing = supabase.table("products").select("id", count="exact").limit(1).execute()
        if existing.count > 0:
            print(f"ABORTING SEED: The 'products' table already contains {existing.count} records.")
            print("To re-seed, manually clear the target rows first to avoid silent duplication.")
            sys.exit(0)
    except Exception as e:
        print(f"ERROR: Failed to check database state: {str(e)}")
        sys.exit(1)
        
    # 4. Load dataset
    csv_path = PROJECT_ROOT / 'data' / 'processed' / 'products_cleaned.csv'
    if not csv_path.exists():
        print(f"ERROR: Dataset not found at {csv_path}")
        sys.exit(1)
        
    print(f"Loading dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    original_row_count = len(df)
    
    # Filter out rows with missing prices to satisfy NOT NULL constraint
    df = df.dropna(subset=['price']).copy()
    final_eligible_count = len(df)
    removed_count = original_row_count - final_eligible_count
    
    print(f"Original cleaned row count: {original_row_count}")
    print(f"Rows removed (missing price): {removed_count}")
    print(f"Final number of rows eligible for insertion: {final_eligible_count}")
    
    # 5. Convert NaN/NaT to proper Python None for JSON serialization
    df = df.replace({pd.NA: None, float('nan'): None})
    
    # Ensure search_aliases are formatted as lists for Supabase text[] array insertion, 
    # but pandas reads the '{a,b}' format as strings. Supabase python client takes python lists.
    # We generated '{}' string in pandas. Let's parse it back to a python list.
    def parse_pg_array(arr_str):
        if not arr_str or arr_str == '{}': return []
        # strip brackets and split by comma. We generated them with double quotes.
        clean = arr_str.strip('{}')
        import shlex
        try:
            return shlex.split(clean) # handles quoted csv
        except:
            return []
            
    df['search_aliases'] = df['search_aliases'].apply(parse_pg_array)
    
    records = df.to_dict(orient='records')
    total_records = len(records)
    
    # 6. Insert in batches
    batch_size = 500
    total_batches = math.ceil(total_records / batch_size)
    
    print(f"Preparing to insert {total_records} products in {total_batches} batches...")
    
    for i in range(total_batches):
        batch = records[i * batch_size : (i + 1) * batch_size]
        try:
            supabase.table("products").insert(batch).execute()
            print(f"Inserted batch {i + 1}/{total_batches}")
        except Exception as e:
            print(f"ERROR: Batch {i + 1} failed to insert.")
            print(f"Details: {str(e)[:200]}...") # truncate to prevent excessive secret leakage if any
            sys.exit(1)
            
    print("\nSeeding complete. Running verification queries...")
    
    # 7. Verification Queries
    try:
        # Total product count
        total_resp = supabase.table("products").select("id", count="exact").limit(1).execute()
        
        # Products with prices
        priced_resp = supabase.table("products").select("id", count="exact").not_.is_("price", "null").limit(1).execute()
        
        # Products on sale
        sale_resp = supabase.table("products").select("id", count="exact").eq("is_on_sale", True).limit(1).execute()
        
        # Organic products
        organic_resp = supabase.table("products").select("id", count="exact").eq("is_organic", True).limit(1).execute()
        
        # Category counts
        # We must paginate because PostgREST limits select queries to 1000 rows by default
        from collections import Counter
        cat_counts = Counter()
        offset = 0
        limit = 1000
        while True:
            resp = supabase.table("products").select("category").range(offset, offset + limit - 1).execute()
            if not resp.data:
                break
            for row in resp.data:
                cat_counts[row['category']] += 1
            if len(resp.data) < limit:
                break
            offset += limit
        
        print(f"\n--- Database Verification ---")
        print(f"Total product count: {total_resp.count}")
        print(f"Products with prices: {priced_resp.count}")
        print(f"Products on sale: {sale_resp.count}")
        print(f"Organic products: {organic_resp.count}")
        print("Category Counts:")
        for cat, count in cat_counts.most_common():
            print(f"  - {cat}: {count}")
        
    except Exception as e:
        print(f"Warning: Verification query failed: {str(e)}")

if __name__ == "__main__":
    main()
