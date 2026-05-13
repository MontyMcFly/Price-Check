-- Add quantity and unit columns to products table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS quantity_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT;

-- Examples of valid units: 'g', 'kg', 'ml', 'l', 'oz', 'lb', 'units'
