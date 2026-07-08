-- 0013: RLS del Motor de Pagos. Sin módulo de permiso "Pagos" nuevo
-- (decisión aprobada, punto 5): la autorización de un movimiento depende
-- siempre del permiso sobre la entidad de la que se origina — Clientes
-- para cobros, Proveedores para pagos. "Anular" reutiliza el permiso de
-- "archivar" de esa misma entidad, porque conceptualmente es la misma
-- operación (marcar archived_at) que ya usa esa acción en todo el resto
-- de la app.

alter table public.medios_pago enable row level security;
alter table public.movimientos enable row level security;

create policy medios_pago_select on public.medios_pago for select using (auth.uid() is not null);
create policy medios_pago_write on public.medios_pago for all
  using (public.tiene_permiso('configuracion', 'modificar'))
  with check (public.tiene_permiso('configuracion', 'modificar'));

create policy movimientos_select on public.movimientos for select
  using (
    (tipo = 'cobro' and public.tiene_permiso('clientes', 'ver'))
    or (tipo = 'pago' and public.tiene_permiso('proveedores', 'ver'))
  );

create policy movimientos_insert on public.movimientos for insert
  with check (
    (tipo = 'cobro' and public.tiene_permiso('clientes', 'crear'))
    or (tipo = 'pago' and public.tiene_permiso('proveedores', 'crear'))
  );

-- Único UPDATE permitido en la práctica es la anulación (la app nunca
-- ofrece editar un movimiento) — se autoriza con el permiso de "archivar"
-- de la entidad relacionada.
create policy movimientos_update on public.movimientos for update
  using (
    (tipo = 'cobro' and public.tiene_permiso('clientes', 'archivar'))
    or (tipo = 'pago' and public.tiene_permiso('proveedores', 'archivar'))
  )
  with check (
    (tipo = 'cobro' and public.tiene_permiso('clientes', 'archivar'))
    or (tipo = 'pago' and public.tiene_permiso('proveedores', 'archivar'))
  );
