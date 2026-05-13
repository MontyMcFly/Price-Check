-- ============================================================
-- MIGRATION: Run this in the Supabase SQL Editor
-- Adds all missing columns and fixes RLS policies
-- ============================================================

-- 1. Add missing columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantity_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS package_size INTEGER DEFAULT 1;

-- 2. Ensure RLS is enabled on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- 3. PRODUCTS policies
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_insert" ON public.products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "products_update" ON public.products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "products_delete" ON public.products
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. STORES policies
DROP POLICY IF EXISTS "stores_select" ON public.stores;
DROP POLICY IF EXISTS "stores_insert" ON public.stores;

CREATE POLICY "stores_select" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "stores_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. PRICES policies
DROP POLICY IF EXISTS "prices_select" ON public.prices;
DROP POLICY IF EXISTS "prices_insert" ON public.prices;

CREATE POLICY "prices_select" ON public.prices
  FOR SELECT USING (true);

CREATE POLICY "prices_insert" ON public.prices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. SHOPPING LIST policies (private per user)
DROP POLICY IF EXISTS "shopping_list_select" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_list_insert" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_list_delete" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_list_update" ON public.shopping_list;

CREATE POLICY "shopping_list_select" ON public.shopping_list
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "shopping_list_insert" ON public.shopping_list
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_list_delete" ON public.shopping_list
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "shopping_list_update" ON public.shopping_list
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. PROFILES table (for usernames)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 8. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
