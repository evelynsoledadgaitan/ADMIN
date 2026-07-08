-- 0052: Notas — el módulo más simple de ADMIN, y la primera excepción
-- explícita a la inmutabilidad que rige el resto del sistema (decisión
-- aprobada, ver docs/sistemas/notas-diseno.md sección 3): una nota se
-- edita directamente (título, descripción, fecha, recordatorio), sin
-- anular ni recrear. Esta excepción aplica únicamente acá — el resto de
-- los módulos sigue exactamente igual.
--
-- Por eso mismo, sin anulado_por/motivo_anulacion: archivar una nota es
-- una acción simple (mismo comportamiento que ya tiene useArchivable,
-- que nunca exigió motivo). Sin trigger de auditoría tampoco — se evaluó
-- sumarlo (es gratis, ya existe) pero se dejó afuera para no agregar una
-- sección de "Actividad" a un módulo pensado para ser mínimo.

create table public.notas (
  id uuid primary key default gen_random_uuid(),

  titulo text not null,
  descripcion text,
  fecha date,
  recordatorio date,
  realizada boolean not null default false,

  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.notas
  for each row execute function public.set_updated_at();

create index notas_recordatorio_idx on public.notas (recordatorio) where archived_at is null and realizada = false;
