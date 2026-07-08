-- 0049: Configuración — los 3 catálogos que hasta ahora no tenían
-- ninguna pantalla de administración (condiciones_iva, medios_pago,
-- modalidades_pago_empleado) suman las mismas columnas que ya tiene
-- categorias_productos, para poder crear/editar/archivar igual que ahí.
-- No hace falta ninguna migración de RLS: las políticas de estas 3
-- tablas ya usan el permiso `configuracion` desde que se crearon
-- (migraciones 0008/0013) — "for all" ya cubre el update que hace falta
-- para archivar.

alter table public.condiciones_iva
  add column archived_at timestamptz,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table public.medios_pago
  add column archived_at timestamptz,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

alter table public.modalidades_pago_empleado
  add column archived_at timestamptz,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

create trigger set_updated_at before update on public.condiciones_iva for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.medios_pago for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.modalidades_pago_empleado for each row execute function public.set_updated_at();

create trigger audit_condiciones_iva after insert or update on public.condiciones_iva for each row execute function public.registrar_auditoria();
create trigger audit_medios_pago after insert or update on public.medios_pago for each row execute function public.registrar_auditoria();
create trigger audit_modalidades_pago_empleado after insert or update on public.modalidades_pago_empleado for each row execute function public.registrar_auditoria();
