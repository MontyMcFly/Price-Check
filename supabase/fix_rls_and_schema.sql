-- 1. Recargar el caché de esquema de Supabase para evitar el error HTTP 406 (Not Acceptable)
NOTIFY pgrst, 'reload schema';

-- 2. Configurar las políticas RLS (Row Level Security) para permitir que usuarios autenticados inserten datos

-- =====================
-- TABLA: products
-- =====================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;

CREATE POLICY "products_select" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- TABLA: stores
-- =====================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "stores_select" ON public.stores;
DROP POLICY IF EXISTS "stores_insert" ON public.stores;

CREATE POLICY "stores_select" ON public.stores FOR SELECT USING (true);
CREATE POLICY "stores_insert" ON public.stores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================
-- TABLA: prices
-- =====================
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prices_select" ON public.prices;
DROP POLICY IF EXISTS "prices_insert" ON public.prices;

CREATE POLICY "prices_select" ON public.prices FOR SELECT USING (true);
CREATE POLICY "prices_insert" ON public.prices FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================
-- TABLA: shopping_list
-- =====================
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shopping_list_select" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_list_insert" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_list_delete" ON public.shopping_list;
DROP POLICY IF EXISTS "shopping_list_update" ON public.shopping_list;

CREATE POLICY "shopping_list_select" ON public.shopping_list FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shopping_list_insert" ON public.shopping_list FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_list_delete" ON public.shopping_list FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "shopping_list_update" ON public.shopping_list FOR UPDATE USING (auth.uid() = user_id);

-- =====================
-- TABLA: profiles
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
