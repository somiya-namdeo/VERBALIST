-- 001_initial_schema.sql
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    description TEXT,
    quantity_value NUMERIC CHECK (quantity_value >= 0),
    quantity_unit TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    sale_price NUMERIC(10,2) CHECK (sale_price >= 0 AND sale_price <= price),
    currency TEXT NOT NULL DEFAULT 'INR',
    is_on_sale BOOLEAN NOT NULL DEFAULT FALSE,
    is_organic BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    search_aliases TEXT[] DEFAULT '{}',
    image_url TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for products updated_at
DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON products(is_on_sale);

-- 2. SHOPPING LIST ITEMS
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for shopping_list_items updated_at
DROP TRIGGER IF EXISTS update_shopping_list_items_modtime ON shopping_list_items;
CREATE TRIGGER update_shopping_list_items_modtime
BEFORE UPDATE ON shopping_list_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for shopping_list_items
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_user_id ON shopping_list_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_product_id ON shopping_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_status ON shopping_list_items(status);

-- 3. SHOPPING HISTORY
CREATE TABLE IF NOT EXISTS shopping_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for shopping_history
CREATE INDEX IF NOT EXISTS idx_shopping_history_user_id ON shopping_history(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_history_product_id ON shopping_history(product_id);
CREATE INDEX IF NOT EXISTS idx_shopping_history_purchased_at ON shopping_history(purchased_at);

-- 4. USER PREFERENCES
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_brands TEXT[] DEFAULT '{}',
    preferred_categories TEXT[] DEFAULT '{}',
    dietary_preferences TEXT[] DEFAULT '{}',
    preferred_units TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger for user_preferences updated_at
DROP TRIGGER IF EXISTS update_user_preferences_modtime ON user_preferences;
CREATE TRIGGER update_user_preferences_modtime
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. PRODUCT SUBSTITUTES
CREATE TABLE IF NOT EXISTS product_substitutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    substitute_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority > 0),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_product_not_self_substitute CHECK (product_id != substitute_product_id),
    CONSTRAINT uq_product_substitute UNIQUE(product_id, substitute_product_id)
);

-- Indexes for product_substitutes
CREATE INDEX IF NOT EXISTS idx_product_substitutes_product_id ON product_substitutes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_substitutes_substitute_product_id ON product_substitutes(substitute_product_id);

-- 6. SEASONAL PRODUCTS
CREATE TABLE IF NOT EXISTS seasonal_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    season TEXT NOT NULL,
    region TEXT NOT NULL DEFAULT 'India',
    priority INTEGER NOT NULL DEFAULT 1 CHECK (priority > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_seasonal_product UNIQUE(product_id, season, region)
);

-- Indexes for seasonal_products
CREATE INDEX IF NOT EXISTS idx_seasonal_products_product_id ON seasonal_products(product_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_products_season ON seasonal_products(season);
CREATE INDEX IF NOT EXISTS idx_seasonal_products_region ON seasonal_products(region);


-- ENABLE ROW LEVEL SECURITY
-- User-specific tables (protected by auth.uid policies below)
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Catalog tables (protected: accessible only by service-role / backend)
-- No public policies are created for these, meaning client access is denied by default.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_products ENABLE ROW LEVEL SECURITY;

-- CREATE RLS POLICIES
-- Policy: Users can only select/insert/update/delete their own shopping list items
CREATE POLICY "Users can manage their own shopping list items" ON shopping_list_items
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only select/insert/update/delete their own shopping history
CREATE POLICY "Users can manage their own shopping history" ON shopping_history
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only select/insert/update/delete their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
