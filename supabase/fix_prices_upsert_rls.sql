-- El comando "upsert" requiere permisos tanto de INSERT como de UPDATE.
-- Añadimos la política de UPDATE para la tabla 'prices'.

CREATE POLICY "prices_update" ON public.prices 
FOR UPDATE USING (auth.role() = 'authenticated');
