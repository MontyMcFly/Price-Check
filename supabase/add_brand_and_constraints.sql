-- 1. Añadir columna 'brand' a 'products'
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;

-- 2. Asegurar que solo exista un precio por producto por tienda
-- Primero, eliminamos duplicados en caso de que ya existan dejando solo el más reciente
DELETE FROM public.prices p1
USING public.prices p2
WHERE p1.product_id = p2.product_id
  AND p1.store_id = p2.store_id
  AND p1.date_recorded < p2.date_recorded;

-- Luego creamos una restricción UNIQUE en (product_id, store_id)
ALTER TABLE public.prices DROP CONSTRAINT IF EXISTS unique_product_store;
ALTER TABLE public.prices ADD CONSTRAINT unique_product_store UNIQUE (product_id, store_id);

-- 3. Refrescar el caché de PostgREST
NOTIFY pgrst, 'reload schema';
