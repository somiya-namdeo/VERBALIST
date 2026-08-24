import os
import sys
import pandas as pd
import hashlib
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

def get_keywords(name, category):
    name_lower = str(name).lower()
    if 'coffee' in name_lower: return 'coffee'
    if 'tea' in name_lower: return 'tea'
    if 'milk' in name_lower: return 'milk'
    if 'diaper' in name_lower: return 'diaper'
    if 'wipe' in name_lower: return 'wipes'
    if 'water' in name_lower: return 'water,bottle'
    if 'juice' in name_lower: return 'juice'
    if 'chocolate' in name_lower: return 'chocolate'
    if 'cheese' in name_lower: return 'cheese'
    if 'butter' in name_lower: return 'butter'
    if 'oil' in name_lower: return 'oil'
    if 'sugar' in name_lower: return 'sugar'
    if 'apple' in name_lower: return 'apple'
    if 'banana' in name_lower: return 'banana'
    if 'bread' in name_lower: return 'bread'
    if 'chicken' in name_lower: return 'chicken'
    if 'rice' in name_lower: return 'rice'
    
    cat_map = {
        'fruits_vegetables': 'fruit,vegetable',
        'pantry': 'pantry,food',
        'stationery': 'stationery,office',
        'personal_care': 'personalcare,soap',
        'dairy': 'dairy,milk',
        'household': 'household,cleaning',
        'beverages': 'beverage,drink',
        'snacks': 'snack,chips'
    }
    return cat_map.get(str(category).lower(), 'grocery,product')

def generate_image_url(name, category):
    keywords = get_keywords(name, category)
    hash_object = hashlib.md5(str(name).encode('utf-8'))
    lock_val = int(hash_object.hexdigest(), 16) % 10000 + 1
    return f"https://loremflickr.com/400/400/{keywords}?lock={lock_val}"

def main():
    SCRIPT_DIR = Path(__file__).resolve().parent
    BACKEND_DIR = SCRIPT_DIR.parent
    PROJECT_ROOT = BACKEND_DIR.parent
    
    # 1. Update CSV
    csv_path = PROJECT_ROOT / 'data' / 'processed' / 'products_cleaned.csv'
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    df['image_url'] = df.apply(lambda row: generate_image_url(row['name'], row['category']), axis=1)
    df.to_csv(csv_path, index=False)
    print("CSV updated with image URLs.")

    # 2. Update DB
    env_path = BACKEND_DIR / '.env'
    load_dotenv(env_path)
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("ERROR: Supabase credentials not found.")
        sys.exit(1)
        
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("Fetching products from DB to update...")
    
    batch_size = 1000
    offset = 0
    all_data = []
    
    while True:
        resp = supabase.table("products").select("id, name, category, brand, description, quantity_value, quantity_unit, price, sale_price, currency, is_on_sale, is_organic, is_available, search_aliases").range(offset, offset + batch_size - 1).execute()
        if not resp.data:
            break
        all_data.extend(resp.data)
        print(f"Fetched {len(all_data)} products...")
        if len(resp.data) < batch_size:
            break
        offset += batch_size
        
    print(f"Total fetched from DB: {len(all_data)}")
    
    for row in all_data:
        row['image_url'] = generate_image_url(row['name'], row['category'])
        
    upsert_batch_size = 500
    total_batches = (len(all_data) + upsert_batch_size - 1) // upsert_batch_size
    for i in range(total_batches):
        batch = all_data[i * upsert_batch_size : (i + 1) * upsert_batch_size]
        try:
            supabase.table("products").upsert(batch).execute()
            print(f"Upserted batch {i+1}/{total_batches}")
        except Exception as e:
            print(f"Batch {i+1} failed: {e}")
            
    print("Database updated successfully.")

if __name__ == "__main__":
    main()
