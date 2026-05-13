-- 1. Create Tables

CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  barcode TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  date_recorded DATE DEFAULT CURRENT_DATE,
  user_id UUID -- Optional for now until Auth is fully set up
);

CREATE TABLE shopping_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending' or 'purchased'
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert Mock Data

INSERT INTO products (name, category) VALUES 
('Sony WH-1000XM4', 'Electronics'),
('Apple Watch Series 8', 'Electronics'),
('MacBook Air M2', 'Electronics'),
('Breville Barista Express', 'Appliances');

INSERT INTO stores (name, location) VALUES 
('Target', 'Downtown'),
('Best Buy', 'North Mall'),
('Amazon', 'Online');

-- Get IDs for insertion (This is conceptual, in real SQL we'd use subqueries or CTEs for exact IDs)
DO $$
DECLARE
  sony_id UUID;
  apple_id UUID;
  target_id UUID;
  bestbuy_id UUID;
BEGIN
  SELECT id INTO sony_id FROM products WHERE name = 'Sony WH-1000XM4' LIMIT 1;
  SELECT id INTO apple_id FROM products WHERE name = 'Apple Watch Series 8' LIMIT 1;
  SELECT id INTO target_id FROM stores WHERE name = 'Target' LIMIT 1;
  SELECT id INTO bestbuy_id FROM stores WHERE name = 'Best Buy' LIMIT 1;

  INSERT INTO prices (product_id, store_id, price) VALUES 
  (sony_id, target_id, 298.00),
  (sony_id, bestbuy_id, 348.00),
  (apple_id, target_id, 399.00);

  INSERT INTO shopping_list (product_id, quantity, status) VALUES 
  (sony_id, 1, 'pending'),
  (apple_id, 1, 'pending');
END $$;
