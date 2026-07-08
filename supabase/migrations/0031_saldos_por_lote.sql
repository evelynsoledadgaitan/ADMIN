-- 0031: saldos_clientes() y saldos_proveedores() — Estado de cuenta como
-- columna del listado (no de una sola ficha). Devuelven el saldo de TODOS
-- los clientes/proveedores activos en una sola consulta.
--
-- Por qué una función nueva en vez de llamar saldo_cliente()/
-- saldo_proveedor() una vez por fila: con un listado de, digamos, 80
-- clientes, eso serían 80 consultas a Supabase solo para pintar la
-- pantalla — el clásico problema N+1. Estas dos funciones calculan lo
-- mismo (mismo criterio exacto: cargos activos - pagos activos + ajustes
-- activos) pero agregado por GROUP BY, en una sola consulta.
--
-- Gemelas entre sí (mismo criterio que saldo_cliente()/saldo_proveedor():
-- dos funciones cortas y explícitas en vez de una genérica con SQL
-- dinámico) y gemelas de las funciones de saldo individual — deben
-- devolver siempre el mismo número para el mismo cliente/proveedor.

create or replace function public.saldos_clientes()
returns table (cliente_id uuid, saldo numeric)
language sql
stable
as $$
  select
    c.id,
    coalesce(d.total, 0) - coalesce(m.total, 0) + coalesce(a.total, 0)
  from public.clientes c
  left join (
    select cliente_id, sum(monto) as total from public.deudas_clientes
    where archived_at is null group by cliente_id
  ) d on d.cliente_id = c.id
  left join (
    select cliente_id, sum(monto) as total from public.movimientos
    where tipo = 'cobro' and archived_at is null group by cliente_id
  ) m on m.cliente_id = c.id
  left join (
    select cliente_id, sum(monto) as total from public.ajustes_cuenta
    where archived_at is null group by cliente_id
  ) a on a.cliente_id = c.id
  where c.archived_at is null;
$$;

create or replace function public.saldos_proveedores()
returns table (proveedor_id uuid, saldo numeric)
language sql
stable
as $$
  select
    p.id,
    coalesce(co.total, 0) - coalesce(m.total, 0) + coalesce(a.total, 0)
  from public.proveedores p
  left join (
    select proveedor_id, sum(monto) as total from public.compras
    where archived_at is null group by proveedor_id
  ) co on co.proveedor_id = p.id
  left join (
    select proveedor_id, sum(monto) as total from public.movimientos
    where tipo = 'pago' and archived_at is null group by proveedor_id
  ) m on m.proveedor_id = p.id
  left join (
    select proveedor_id, sum(monto) as total from public.ajustes_cuenta
    where archived_at is null group by proveedor_id
  ) a on a.proveedor_id = p.id
  where p.archived_at is null;
$$;

comment on function public.saldos_clientes() is
  'Saldo de todos los clientes activos en una sola consulta (evita N+1 en el listado). Mismo criterio que saldo_cliente().';
comment on function public.saldos_proveedores() is
  'Saldo de todos los proveedores activos en una sola consulta (evita N+1 en el listado). Mismo criterio que saldo_proveedor().';
