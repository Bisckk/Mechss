-- Migration: 00008_public_landing_rls
-- Fixes 404 error by allowing public access to published landing pages

CREATE POLICY "Public can view landing pages" 
ON public.workshop_landing_pages FOR SELECT 
USING (true); -- Permitimos leer a todos públicamente porque es la landing pública

-- Al ser una Landing, también el público necesita ver el nombre del taller y su información en la tabla 'workshops'
-- Verifiquemos si la tabla workshops permite lectura pública:
-- CREATE POLICY "Public can view active workshops"
-- ON public.workshops FOR SELECT
-- USING (is_active = true);
