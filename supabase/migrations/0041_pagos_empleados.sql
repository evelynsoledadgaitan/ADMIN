-- 0041: historial de pagos y adelantos a empleados — tabla propia,
-- deliberadamente separada del Motor de Pagos (decisión aprobada, punto
-- 1): `movimientos` ya es una pieza compartida, probada y cerrada de
-- Clientes y Proveedores — sumarle una tercera entidad hubiera sido más
-- riesgo (RLS, índices, cualquier consulta que asuma "es cliente o
-- proveedor") a cambio de ahorrar esta tabla chica. Mismo criterio que ya
-- se usó para separar Deudas de Compras en su momento.
--
-- Sin saldo, sin cuenta corriente (confirmado, punto 4) — es un historial
-- cronológico, nada más. "Pago" y "adelanto" son dos acciones distintas
-- en la interfaz (decisión aprobada, punto 3), pero graban en la misma
-- tabla — el campo `tipo` es la única diferencia real entre ambas.

create table public.pagos_empleados (
  id uuid primary key default gen_random_uuid(),

  numero_interno bigint generated always as identity unique,

  empleado_id uuid not null references public.empleados(id),
  tipo text not null check (tipo in ('pago', 'adelanto')),

  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default current_date check (fecha <= current_date),
  medio_pago_id uuid references public.medios_pago(id),
  nota text,
  comprobante_path text,

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.pagos_empleados
  for each row execute function public.set_updated_at();

create trigger audit_pagos_empleados
  after insert or update on public.pagos_empleados
  for each row execute function public.registrar_auditoria();

create index pagos_empleados_empleado_idx on public.pagos_empleados (empleado_id, fecha desc, created_at desc);
