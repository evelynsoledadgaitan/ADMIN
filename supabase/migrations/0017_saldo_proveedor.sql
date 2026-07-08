-- 0017: saldo de un proveedor — función, no columna (decisión aprobada,
-- observación E). Los hechos (compras y pagos) son siempre la fuente de
-- verdad; nada queda desincronizado porque no hay nada que sincronizar.
--
-- Sin `security definer` a propósito: corre con los permisos de quien
-- llama, así que las políticas de RLS de `compras` y `movimientos` se
-- aplican igual que en cualquier otra consulta — nadie ve, a través de
-- esta función, un dato que no podría ver directamente.

create or replace function public.saldo_proveedor(p_proveedor_id uuid)
returns numeric
language sql
stable
as $$
  select
    coalesce((
      select sum(monto) from public.compras
      where proveedor_id = p_proveedor_id and archived_at is null
    ), 0)
    -
    coalesce((
      select sum(monto) from public.movimientos
      where proveedor_id = p_proveedor_id and tipo = 'pago' and archived_at is null
    ), 0);
$$;

comment on function public.saldo_proveedor(uuid) is
  'Compras activas menos pagos activos. No se persiste en ninguna tabla — se recalcula en cada consulta a partir de compras y movimientos.';
