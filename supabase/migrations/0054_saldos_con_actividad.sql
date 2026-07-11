-- 0054: Informes — "Más reciente actividad" / "Más antigua actividad"
-- como criterio de ordenamiento. Se extienden las funciones que ya
-- existen (`saldos_clientes()`, `saldos_proveedores()`, migración 0031)
-- para que devuelvan también la fecha del movimiento más reciente de
-- cada cliente/proveedor — en la misma consulta de siempre, sin agregar
-- ningún viaje nuevo a la base (decisión aprobada explícita: "pocas
-- consultas, evitar lógica innecesaria en el navegador").
--
-- Los hooks que ya usan estas funciones (`useSaldosClientes`,
-- `useSaldosProveedores`, usados en los listados de Clientes/
-- Proveedores) no necesitan ningún cambio — siguen leyendo solo `saldo`
-- de cada fila, la columna nueva la ignoran sin problema. Informes suma
-- un hook propio que sí la lee (ver `useSaldosClientesConActividad`/
-- `useSaldosProveedoresConActividad` en el código).

-- Postgres no permite que CREATE OR REPLACE cambie la cantidad de
-- columnas que devuelve una función existente — hay que borrarla
-- primero, explícitamente.
drop function if exists public.saldos_clientes();

create or replace function public.saldos_clientes()
returns table (cliente_id uuid, saldo numeric, ultima_actividad date)
language sql
stable
as $$
  select
    c.id,
    coalesce(d.total, 0) - coalesce(m.total, 0) + coalesce(a.total, 0),
    greatest(d.ultima, m.ultima, a.ultima)
  from public.clientes c
  left join (
    select cliente_id, sum(monto) as total, max(fecha) as ultima from public.deudas_clientes
    where archived_at is null group by cliente_id
  ) d on d.cliente_id = c.id
  left join (
    select cliente_id, sum(monto) as total, max(fecha) as ultima from public.movimientos
    where tipo = 'cobro' and archived_at is null group by cliente_id
  ) m on m.cliente_id = c.id
  left join (
    select cliente_id, sum(monto) as total, max(fecha) as ultima from public.ajustes_cuenta
    where archived_at is null group by cliente_id
  ) a on a.cliente_id = c.id
$$;

drop function if exists public.saldos_proveedores();

create or replace function public.saldos_proveedores()
returns table (proveedor_id uuid, saldo numeric, ultima_actividad date)
language sql
stable
as $$
  select
    p.id,
    coalesce(co.total, 0) - coalesce(m.total, 0) + coalesce(a.total, 0),
    greatest(co.ultima, m.ultima, a.ultima)
  from public.proveedores p
  left join (
    select proveedor_id, sum(monto) as total, max(fecha) as ultima from public.compras
    where archived_at is null group by proveedor_id
  ) co on co.proveedor_id = p.id
  left join (
    select proveedor_id, sum(monto) as total, max(fecha) as ultima from public.movimientos
    where tipo = 'pago' and archived_at is null group by proveedor_id
  ) m on m.proveedor_id = p.id
  left join (
    select proveedor_id, sum(monto) as total, max(fecha) as ultima from public.ajustes_cuenta
    where archived_at is null group by proveedor_id
  ) a on a.proveedor_id = p.id
$$;
