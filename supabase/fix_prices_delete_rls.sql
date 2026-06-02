-- Añadimos la política de DELETE para la tabla 'prices' que nos faltó antes.

CREATE POLICY "prices_delete" ON public.prices 
FOR DELETE USING (auth.role() = 'authenticated');
