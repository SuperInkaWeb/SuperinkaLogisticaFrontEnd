-- Fix RLS policies for INSERT operations
-- The issue is that FOR ALL policies with USING don't work for INSERT
-- INSERT requires WITH CHECK clause

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin/Supervisor can manage warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Admin/Supervisor can manage products" ON public.products;
DROP POLICY IF EXISTS "Admin/Supervisor can manage carriers" ON public.carriers;
DROP POLICY IF EXISTS "Authenticated can manage orders" ON public.orders;

-- Recreate policies with proper INSERT support

-- Warehouses policies
CREATE POLICY "Admin/Supervisor can insert warehouses" ON public.warehouses
  FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admin/Supervisor can update warehouses" ON public.warehouses
  FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admin/Supervisor can delete warehouses" ON public.warehouses
  FOR DELETE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

-- Products policies
CREATE POLICY "Admin/Supervisor can insert products" ON public.products
  FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admin/Supervisor can update products" ON public.products
  FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admin/Supervisor can delete products" ON public.products
  FOR DELETE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

-- Carriers policies
CREATE POLICY "Admin/Supervisor can insert carriers" ON public.carriers
  FOR INSERT TO authenticated 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admin/Supervisor can update carriers" ON public.carriers
  FOR UPDATE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

CREATE POLICY "Admin/Supervisor can delete carriers" ON public.carriers
  FOR DELETE TO authenticated 
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor')
  );

-- Orders policies (all authenticated users can manage)
CREATE POLICY "Authenticated can insert orders" ON public.orders
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated can update orders" ON public.orders
  FOR UPDATE TO authenticated 
  USING (true);

CREATE POLICY "Authenticated can delete orders" ON public.orders
  FOR DELETE TO authenticated 
  USING (true);
