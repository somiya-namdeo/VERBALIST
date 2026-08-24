import pandas as pd
import numpy as np
import re
from pathlib import Path

BASE_DIR = Path().resolve()
RAW_DATA_PATH = BASE_DIR / "data" / "raw" / "dataset.csv"
OUTPUT_DATA_PATH = BASE_DIR / "data" / "processed" / "products_cleaned.csv"

df = pd.read_csv(RAW_DATA_PATH)
initial_row_count = len(df)

df = df.drop_duplicates()
dedup_row_count = len(df)

def clean_name(name):
    if pd.isna(name): return ""
    name = str(name).strip()
    name = re.sub(r'\s+', ' ', name)
    return name
df['name'] = df['Product Name'].apply(clean_name)

def normalize_category(cat):
    if pd.isna(cat): return 'other'
    cat = str(cat).lower()
    if any(x in cat for x in ['fruit', 'veg']): return 'fruits_vegetables'
    if any(x in cat for x in ['milk', 'dairy', 'cheese', 'butter', 'ghee', 'paneer']): return 'dairy'
    if any(x in cat for x in ['beverage', 'drink', 'coffee', 'tea', 'juice']): return 'beverages'
    if any(x in cat for x in ['snack', 'chips', 'biscuit', 'chocolate', 'namkeen']): return 'snacks'
    if any(x in cat for x in ['bakery', 'bread', 'cake']): return 'bakery'
    if any(x in cat for x in ['pantry', 'dal', 'pulse', 'rice', 'flour', 'oil', 'spice', 'sugar', 'salt', 'masala']): return 'pantry'
    if any(x in cat for x in ['personal', 'care', 'beauty', 'skin', 'hair', 'shaving', 'soap', 'shampoo']): return 'personal_care'
    if any(x in cat for x in ['household', 'clean', 'detergent', 'wash']): return 'household'
    if any(x in cat for x in ['baby', 'diaper', 'wipes']): return 'baby_care'
    if any(x in cat for x in ['frozen', 'ice cream']): return 'frozen'
    if any(x in cat for x in ['meat', 'fish', 'chicken', 'seafood']): return 'meat_seafood'
    if any(x in cat for x in ['stationery', 'pen', 'paper', 'book']): return 'stationery'
    return 'other'
df['category'] = df['Category'].apply(normalize_category)

def parse_quantity(q_str):
    if pd.isna(q_str): return None, None
    q_str = str(q_str).strip().lower()
    match = re.search(r'^([\d\.]+)\s*([a-zA-Z]+)', q_str)
    if match:
        try:
            val = float(match.group(1))
            unit = match.group(2)
            return val, unit
        except:
            pass
    return None, None

parsed = df['Quantity'].apply(parse_quantity)
df['quantity_value'] = parsed.apply(lambda x: x[0])
df['quantity_unit'] = parsed.apply(lambda x: x[1])

df['price'] = pd.to_numeric(df['Original Price (Rs.)'], errors='coerce')
df['sale_price'] = pd.to_numeric(df['Discounted Price (Rs.)'], errors='coerce')
df['price_available'] = df['price'].notna()
df['is_on_sale'] = np.where(df['price_available'] & df['sale_price'].notna() & (df['sale_price'] < df['price']), True, False)

df['currency'] = 'INR'
df['brand'] = None
df['is_organic'] = df['name'].str.lower().str.contains('organic').fillna(False)

def get_aliases(name):
    if not name: return "{}"
    aliases = [name.lower()]
    tokens = [t for t in name.lower().split() if len(t) > 3]
    aliases.extend(tokens)
    aliases = list(set(aliases))
    return "{" + ",".join(['"' + a.replace('"', '\\"') + '"' for a in aliases]) + "}"
df['search_aliases'] = df['name'].apply(get_aliases)

df['description'] = None
df['is_available'] = True
df['source'] = 'bigbasket_dataset'
df['image_url'] = None

schema_cols = [
    'name', 'brand', 'category', 'description',
    'quantity_value', 'quantity_unit', 'price',
    'sale_price', 'currency', 'is_on_sale',
    'is_organic', 'is_available', 'search_aliases',
    'image_url', 'source'
]

out_df = df[schema_cols].copy()
out_df = out_df.drop_duplicates()
final_row_count = len(out_df)

out_df.to_csv(OUTPUT_DATA_PATH, index=False)

print(f"final_rows:{final_row_count}")
print(f"missing_price:{out_df['price'].isna().sum()}")
print(f"unique_categories:{out_df['category'].nunique()}")
print(f"parsed_quantities:{out_df['quantity_value'].notna().sum()}")
print(f"on_sale:{out_df['is_on_sale'].sum()}")
