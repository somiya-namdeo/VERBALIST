# Verbalist Data Pipeline

## 1. Purpose
The product data pipeline exists to ingest public, unstructured or semi-structured grocery dataset CSVs and normalize them into a clean, unified format suitable for direct import into the Verbalist PostgreSQL `products` table. This acts as the catalog foundation for the voice agent.

## 2. Source Dataset
The pipeline processes the real dataset located at `data/raw/dataset.csv`. This data acts purely as a product catalog foundation, supporting voice search, price/brand filtering, sale recommendations, and categorization. **It is not supposed to contain user shopping history.**

## 3. Cleaning Decisions & Transformations
- **Duplicates**: Exact duplicate rows and resulting duplicate schema-mapped rows are removed.
- **Product Names**: Trimmed and normalized for spacing; meaningful content is preserved.
- **Categories**: Promotional categories (e.g. `bigbasket`, `Minimum 30% Off`) and ambiguous labels are remapped to standard categories like `dairy`, `snacks`, `personal_care`, or `other` if indeterminable.
- **Quantities**: Parsed out of unstructured text (e.g., `80 pcs`) into `quantity_value` (numeric) and `quantity_unit` (text) using robust regex.
- **Prices**: `Original Price` is mapped to `price` and `Discounted Price` to `sale_price`. They are converted to numeric, preserving valid zero values. Missing prices are explicitly kept as `NULL` without fabrication.
- **Sales Status**: `is_on_sale` is explicitly calculated based on `sale_price < price`.
- **Search Aliases**: Deterministic tokenization of product names was used to generate aliases suitable for voice search matching (no LLMs used).

## 4. Assumptions & Inferred Fields
- **Availability**: `is_available` is defaulted to `True` for catalog representation. It is an explicitly documented assumption because the source dataset does not have live real-time inventory.
- **Organic Status**: `is_organic` is conservatively inferred to be `True` only if the product name contains "organic".
- **Brands**: `brand` is defaulted to `NULL` to prevent false extractions without a robust known-brand registry, adhering to conservative cleaning principles.

## 5. Fields Unavailable in Source Data
- `image_url`: Left `NULL`.
- `description`: Left `NULL`.
- `id` / `created_at` / `updated_at`: Deferred to Supabase database generation.

## 6. Validation Performed
The pipeline strictly validates for:
- Required non-null fields (`name`, `category`).
- Valid boolean fields (`is_on_sale`, `is_organic`).
- No negative pricing or negative quantities.
- Consistency between price and sale_price (sale_price <= price).
- No remaining exact duplicates.

## 7. Output Dataset
The fully transformed, validated, and normalized data is exported to `data/processed/products_cleaned.csv` and is ready for database seeding.
