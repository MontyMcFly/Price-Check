-- ============================================================
-- STEP 1: Create Profiles Table (stores username per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "All authenticated users can read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);


-- ============================================================
-- STEP 2: Trigger to auto-create profile on sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- STEP 3: RLS for Shopping List (user-specific)
-- ============================================================
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON public.shopping_list;

CREATE POLICY "Users manage their own list" ON public.shopping_list
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- STEP 4: Shared Product Catalog (authenticated users only)
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.stores;
CREATE POLICY "Authenticated users can manage stores" ON public.stores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for anon" ON public.prices;
CREATE POLICY "Authenticated users can manage prices" ON public.prices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- STEP 5: Create the "Puguita" user
-- Run this AFTER all the above has been executed.
-- ============================================================
-- SELECT auth.create_user(
--   '{"email": "puguita@pricecheck.app", "password": "123456", "email_confirm": true, "user_metadata": {"username": "Puguita"}}'
-- );
