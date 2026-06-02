-- 1. Columna para URL del ticket en prices
ALTER TABLE public.prices ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 2. Políticas de Storage para el bucket 'receipts'
-- NOTA: Primero debes crear el bucket manualmente:
--   Supabase Dashboard > Storage > New Bucket > Nombre: "receipts" > Public: ON

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');

-- Permitir a cualquiera ver los tickets
CREATE POLICY "Anyone can view receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Permitir a usuarios autenticados borrar archivos (para el cron de limpieza)
CREATE POLICY "Users can delete receipts" ON storage.objects
FOR DELETE USING (bucket_id = 'receipts' AND auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
