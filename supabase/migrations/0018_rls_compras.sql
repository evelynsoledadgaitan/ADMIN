-- 0018: RLS de Compras. Mismo criterio que Motor de Pagos (migración
-- 0013): sin módulo de permiso nuevo — se hereda el permiso de
-- Proveedores, porque una compra siempre pertenece a un proveedor.

alter table public.compras enable row level security;

create policy compras_select on public.compras for select
  using (public.tiene_permiso('proveedores', 'ver'));

create policy compras_insert on public.compras for insert
  with check (public.tiene_permiso('proveedores', 'crear'));

-- Único UPDATE real es la anulación (la app nunca ofrece editar una
-- compra) — se autoriza con el permiso de "archivar" de Proveedores.
create policy compras_update on public.compras for update
  using (public.tiene_permiso('proveedores', 'archivar'))
  with check (public.tiene_permiso('proveedores', 'archivar'));
