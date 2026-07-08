-- 0039: Bloque 4A — Empleados. ADMIN administra, no liquida sueldos: sin
-- cálculos laborales, sin recibos de sueldo, sin AFIP, sin vacaciones ni
-- aguinaldo automáticos (ver docs/decisiones/0025 y
-- docs/sistemas/bloque4a-empleados-diseno.md).
--
-- `cargo` es un campo nuevo, agregado durante el diseño (no estaba en el
-- brief original de 3 campos) — texto libre y opcional, para el resumen
-- de la Ficha.
--
-- `modalidad_pago_id` reutiliza el catálogo `modalidades_pago_empleado`,
-- sembrado desde la Fase 0 y sin usar hasta ahora.

create table public.empleados (
  id uuid primary key default gen_random_uuid(),

  nombre_apellido text not null,
  cargo text,
  modalidad_pago_id uuid references public.modalidades_pago_empleado(id),
  valor numeric(12,2) check (valor is null or valor > 0),

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.empleados
  for each row execute function public.set_updated_at();

create trigger audit_empleados
  after insert or update on public.empleados
  for each row execute function public.registrar_auditoria();

create index empleados_nombre_idx on public.empleados (nombre_apellido);
