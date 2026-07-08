-- 0035: RLS de facturas/factura_items (permiso propio "facturacion") y
-- el puente de permisos aprobado hacia deudas_clientes — quien puede
-- facturar puede generar la deuda automática que corresponde a esa
-- factura, sin necesitar además el permiso de Clientes (decisión 5.2).

alter table public.facturas enable row level security;
alter table public.factura_items enable row level security;

create policy facturas_select on public.facturas for select
  using (public.tiene_permiso('facturacion', 'ver'));

create policy facturas_insert on public.facturas for insert
  with check (public.tiene_permiso('facturacion', 'crear'));

create policy facturas_update on public.facturas for update
  using (public.tiene_permiso('facturacion', 'archivar'))
  with check (public.tiene_permiso('facturacion', 'archivar'));

-- factura_items: inmutables, se insertan una sola vez junto con la
-- cabecera y nunca se editan ni se borran — sin políticas de update/delete.
create policy factura_items_select on public.factura_items for select
  using (public.tiene_permiso('facturacion', 'ver'));

create policy factura_items_insert on public.factura_items for insert
  with check (public.tiene_permiso('facturacion', 'crear'));

-- Puente hacia deudas_clientes: se reemplazan las políticas de insert/
-- update (migración 0027) para aceptar también el permiso "facturacion",
-- además del ya existente "clientes".
drop policy if exists deudas_clientes_insert on public.deudas_clientes;
create policy deudas_clientes_insert on public.deudas_clientes for insert
  with check (
    public.tiene_permiso('clientes', 'crear')
    or public.tiene_permiso('facturacion', 'crear')
  );

drop policy if exists deudas_clientes_update on public.deudas_clientes;
create policy deudas_clientes_update on public.deudas_clientes for update
  using (
    public.tiene_permiso('clientes', 'archivar')
    or public.tiene_permiso('facturacion', 'archivar')
  )
  with check (
    public.tiene_permiso('clientes', 'archivar')
    or public.tiene_permiso('facturacion', 'archivar')
  );
