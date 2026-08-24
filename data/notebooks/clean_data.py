import pandas as pd
import numpy as np
import re
import json

# Load dataset
input_path = 'data/raw/dataset.csv'
output_path = 'data/processed/products_clean.csv'

df = pd.read_csv(input_path)
initial_rows = len(df)

# Step 1: Remove exact duplicates
df = df.drop_duplicates()
rows_after_dedup = len(df)
duplicates_removed = initial_rows - rows_after_dedup

# Step 2: Product Name Cleaning
def clean_name(name):
    if pd.isna(name): return ""
    name = str(name).strip()
    name = re.sub(r'\s+', ' ', name)
    return name

df['name'] = df['Product Name'].apply(clean_name)

# Step 3: Category Normalization
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

# Step 4: Quantity Parsing
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

parsed_success = df['quantity_value'].notna().sum()
parsed_failures = df['quantity_value'].isna().sum()

# Step 5: Price Cleaning
df['price'] = pd.to_numeric(df['Original Price (Rs.)'], errors='coerce')
df['sale_price'] = pd.to_numeric(df['Discounted Price (Rs.)'], errors='coerce')
df['price_available'] = df['price'].notna()
missing_prices = df['price'].isna().sum()

# Step 6: Sale Detection
df['is_on_sale'] = np.where(df['price_available'] & df['sale_price'].notna() & (df['sale_price'] < df['price']), True, False)
on_sale_count = df['is_on_sale'].sum()

# Step 7: Discount Validation
def calc_discount(row):
    if row['price_available'] and pd.notna(row['sale_price']) and row['price'] > 0:
        return round(((row['price'] - row['sale_price']) / row['price']) * 100, 2)
    return None
df['discount_percentage'] = df.apply(calc_discount, axis=1)

# Step 8: Brand Extraction
def extract_brand(name):
    # Very conservative: if first word is capitalized and length > 2
    # But safer to just set NULL to follow instructions strictly to not invent
    # Let's extract first word if it matches a known small list, otherwise None
    return None
df['brand'] = df['name'].apply(extract_brand)
brand_extracted = df['brand'].notna().sum()

# Step 9: Organic Detection
df['is_organic'] = df['name'].str.lower().str.contains('organic').fillna(False)
organic_count = df['is_organic'].sum()

# Step 10: Availability
df['is_available'] = True

# Step 11: Search Aliases
def get_aliases(name):
    if not name: return "{}"
    aliases = [name.lower()]
    tokens = [t for t in name.lower().split() if len(t) > 3]
    aliases.extend(tokens)
    aliases = list(set(aliases))
    # format as postgres text[]
    # properly escape quotes
    return "{" + ",".join(['"' + a.replace('"', '\\"') + '"' for a in aliases]) + "}"
    
df['search_aliases'] = df['name'].apply(get_aliases)

# Step 12: Schema Mapping
df['description'] = None
df['image_url'] = None
df['source'] = 'dataset.csv'
df['currency'] = 'INR'

schema_cols = [
    'name', 'brand', 'category', 'description',
    'quantity_value', 'quantity_unit', 'price',
    'sale_price', 'currency', 'is_on_sale',
    'is_organic', 'is_available', 'search_aliases',
    'image_url', 'source'
]

out_df = df[schema_cols].copy()

# Step 13: Data Quality Validation
val_failures = []
if out_df['name'].isna().sum() > 0: val_failures.append("Null names found")
if out_df['category'].isna().sum() > 0: val_failures.append("Null categories found")
if (out_df['quantity_value'] < 0).sum() > 0: val_failures.append("Negative quantities found")
if (out_df['price'] < 0).sum() > 0: val_failures.append("Negative prices found")
if (out_df['sale_price'] < 0).sum() > 0: val_failures.append("Negative sale prices found")
if (out_df['sale_price'] > out_df['price']).sum() > 0: val_failures.append("Sale price > price found")
if out_df['is_on_sale'].isna().sum() > 0: val_failures.append("is_on_sale has nulls")
if out_df['is_organic'].isna().sum() > 0: val_failures.append("is_organic has nulls")
if out_df['search_aliases'].isna().sum() > 0: val_failures.append("search_aliases has nulls")

# Ensure no exact duplicates
out_df = out_df.drop_duplicates()

if out_df.duplicated().sum() > 0:
    val_failures.append("Exact duplicates remain")

# Step 14: Export
out_df.to_csv(output_path, index=False)

summary = {
    'input_rows': initial_rows,
    'output_rows': len(out_df),
    'duplicates_removed': duplicates_removed,
    'missing_price_count': int(missing_prices),
    'successfully_parsed_quantities': int(parsed_success),
    'quantity_parsing_failures': int(parsed_failures),
    'category_distribution': out_df['category'].value_counts().to_dict(),
    'products_on_sale': int(on_sale_count),
    'products_organic': int(organic_count),
    'extracted_brands': int(brand_extracted),
    'validation_failures': val_failures
}

with open('data/processed/summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

print("Pipeline complete")
