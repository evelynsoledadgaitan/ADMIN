-- 0027: RLS de deudas_clientes (hereda el permiso de Clientes, mismo
-- criterio que compras/movimientos) y de ajustes_cuenta (permiso propio
-- "ajustes", independiente de Clientes/Proveedores — decisión aprobada 6.4).

alter table public.deudas_clientes enable row level security;
alter table public.ajustes_cuenta enable row level security;

create policy deudas_clientes_select on public.deudas_clientes for select
  using (public.tiene_permiso('clientes', 'ver'));

create policy deudas_clientes_insert on public.deudas_clientes for insert
  with check (public.tiene_permiso('clientes', 'crear'));

create policy deudas_clientes_update on public.deudas_clientes for update
  using (public.tiene_permiso('clientes', 'archivar'))
  with check (public.tiene_permiso('clientes', 'archivar'));

-- Ajustes: un único permiso, sin importar si es de un cliente o de un
-- proveedor — es una operación sensible con su propio criterio de
-- autorización, no heredado de la entidad relacionada.
create policy ajustes_cuenta_select on public.ajustes_cuenta for select
  using (public.tiene_permiso('ajustes', 'ver'));

create policy ajustes_cuenta_insert on public.ajustes_cuenta for insert
  with check (public.tiene_permiso('ajustes', 'crear'));

create policy ajustes_cuenta_update on public.ajustes_cuenta for update
  using (public.tiene_permiso('ajustes', 'archivar'))
  with check (public.tiene_permiso('ajustes', 'archivar'));
