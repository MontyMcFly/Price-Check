-- Añadir columnas para el historial de compras
ALTER TABLE public.shopping_list ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.shopping_list ADD COLUMN IF NOT EXISTS final_price NUMERIC;
ALTER TABLE public.shopping_list ADD COLUMN IF NOT EXISTS store_name TEXT;

NOTIFY pgrst, 'reload schema';
