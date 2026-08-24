import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

def main():
    SCRIPT_DIR = Path(__file__).resolve().parent
    BACKEND_DIR = SCRIPT_DIR.parent
    load_dotenv(BACKEND_DIR / '.env')
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)
    
    try:
        total_resp = supabase.table("products").select("id", count="exact").limit(1).execute()
        priced_resp = supabase.table("products").select("id", count="exact").not_.is_("price", "null").limit(1).execute()
        sale_resp = supabase.table("products").select("id", count="exact").eq("is_on_sale", True).limit(1).execute()
        organic_resp = supabase.table("products").select("id", count="exact").eq("is_organic", True).limit(1).execute()
        
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
            
        print(f"Total product count: {total_resp.count}")
        print(f"Products with prices: {priced_resp.count}")
        print(f"Products on sale: {sale_resp.count}")
        print(f"Organic products: {organic_resp.count}")
        print("Category Counts:")
        total_cats = 0
        for cat, count in cat_counts.most_common():
            print(f"  - {cat}: {count}")
            total_cats += count
        print(f"Total category sum: {total_cats}")
        
    except Exception as e:
        print(f"Verification query failed: {str(e)}")

if __name__ == "__main__":
    main()
