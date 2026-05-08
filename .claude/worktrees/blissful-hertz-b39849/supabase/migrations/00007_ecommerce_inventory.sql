-- Migration: 00007_ecommerce_inventory
-- Description: Creates the inventory and ecommerce products tables for workshops

CREATE TYPE product_category AS ENUM ('Accesorios', 'Repuestos', 'Líquidos y Lubricantes', 'Herramientas', 'Otro');

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    
    name VARCHAR(150) NOT NULL,
    description TEXT,
    sku VARCHAR(50), -- Código de barras o identificador interno
    category product_category DEFAULT 'Otro',
    
    -- Pricing and Stock
    cost_price DECIMAL(12,2) DEFAULT 0.00,  -- Lo que le cuesta al taller
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- El precio al público
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    
    -- Ecommerce specifics
    is_published BOOLEAN DEFAULT false, -- ¿Se muestra en la landing page?
    image_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_workshop ON public.inventory_items(workshop_id);
CREATE INDEX IF NOT EXISTS idx_inventory_published ON public.inventory_items(workshop_id) WHERE is_published = true;

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can read ONLY highly-filtered published products (for the ecommerce store)
CREATE POLICY "Public can view published products" 
ON public.inventory_items FOR SELECT 
USING (is_published = true);

-- 2. Workshop members can do everything with their own inventory
CREATE POLICY "Workshop members can view own inventory" 
ON public.inventory_items FOR SELECT 
USING (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

CREATE POLICY "Workshop admins can insert inventory" 
ON public.inventory_items FOR INSERT 
WITH CHECK (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

CREATE POLICY "Workshop admins can update inventory" 
ON public.inventory_items FOR UPDATE 
USING (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

CREATE POLICY "Workshop admins can delete inventory" 
ON public.inventory_items FOR DELETE 
USING (workshop_id = public.get_my_workshop_id() OR public.get_my_role() = 'superadmin');

-- Auto update timestamp
CREATE TRIGGER update_inventory_items_modtime
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_column();
