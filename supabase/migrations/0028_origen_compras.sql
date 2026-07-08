-- 0028: agrega `origen` a `compras` — Reorganización del flujo operativo.
-- Mismo patrón que `deudas_clientes.origen` (migración 0023), con las
-- opciones propias de Proveedores (decisión aprobada, punto 4): Mercadería,
-- Factura, Otro. "Ajuste" NO es un valor de este campo — en la interfaz es
-- una opción del mismo selector que redirige al formulario de Ajuste real
-- (ver docs/sistemas/reorganizacion-flujo-operativo.md, sección 0.1); acá
-- solo se validan los orígenes que efectivamente terminan siendo una fila
-- de `compras`.
--
-- Se agrega `not null default 'mercaderia'` para no romper filas ya
-- existentes (si las hubiera) — cualquier compra cargada antes de esta
-- migración queda clasificada como "Mercadería", que es el caso más común.

alter table public.compras
  add column origen text not null default 'mercaderia'
    check (origen in ('mercaderia', 'factura', 'otro'));

alter table public.compras alter column origen drop default;
