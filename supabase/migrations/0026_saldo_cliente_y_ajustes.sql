-- 0026: saldo_cliente() — función gemela de saldo_proveedor() (migración
-- 0017), mismo criterio exacto: sin `security definer`, sin persistir
-- nada, se recalcula siempre a partir de los hechos. Se actualiza también
-- saldo_proveedor() para sumar los ajustes, que no existían cuando se
-- escribió originalmente.
--
-- No se buscó una única función genérica parametrizada por tabla: en
-- PostgreSQL eso requiere SQL dinámico, que cambia el perfil de seguridad
-- de la función. Dos funciones cortas y gemelas son más simples de leer y
-- de auditar que una genérica con más superficie — ver
-- docs/sistemas/cuenta-corriente-arquitectura-compartida.md, sección 3.2.

create or replace function public.saldo_cliente(p_cliente_id uuid)
returns numeric
language sql
stable
as $$
  select
    coalesce((
      select sum(monto) from public.deudas_clientes
      where cliente_id = p_cliente_id and archived_at is null
    ), 0)
    -
    coalesce((
      select sum(monto) from public.movimientos
      where cliente_id = p_cliente_id and tipo = 'cobro' and archived_at is null
    ), 0)
    +
    coalesce((
      select sum(monto) from public.ajustes_cuenta
      where cliente_id = p_cliente_id and archived_at is null
    ), 0);
$$;

comment on function public.saldo_cliente(uuid) is
  'Deudas activas menos cobros activos, más ajustes activos (con signo). No se persiste en ninguna tabla.';

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
    ), 0)
    +
    coalesce((
      select sum(monto) from public.ajustes_cuenta
      where proveedor_id = p_proveedor_id and archived_at is null
    ), 0);
$$;

comment on function public.saldo_proveedor(uuid) is
  'Compras activas menos pagos activos, más ajustes activos (con signo). No se persiste en ninguna tabla.';
