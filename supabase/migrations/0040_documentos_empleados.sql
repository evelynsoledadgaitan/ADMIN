-- 0040: documentación del empleado — primera relación "uno a muchos" de
-- adjuntos en todo el sistema (hasta ahora, cualquier cosa con adjunto
-- tenía como mucho uno). No es un cambio al sistema de adjuntos en sí
-- (sigue siendo el mismo ArchivoAdjunto/VisorAdjunto de siempre) — es una
-- tabla propia donde cada fila es un documento con su propio archivo.
--
-- `tipo_documento`: catálogo chico y fijo (decisión aprobada, punto 2).
-- `descripcion_otro` solo se usa cuando tipo_documento='otro' — el CHECK
-- exige que esté completo en ese caso y vacío en cualquier otro, para que
-- no quede un campo suelto sin sentido cuando no corresponde.
--
-- Un documento no se edita, solo se anula (mismo criterio de siempre) —
-- para "reemplazar" un DNI vencido, se anula el viejo y se sube uno nuevo.

create table public.documentos_empleados (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados(id),

  tipo_documento text not null check (tipo_documento in ('dni', 'contrato', 'apto_medico', 'cv', 'certificado', 'otro')),
  descripcion_otro text,
  check (
    (tipo_documento = 'otro' and descripcion_otro is not null and descripcion_otro <> '')
    or (tipo_documento <> 'otro' and descripcion_otro is null)
  ),

  comprobante_path text not null,

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now()
);

create trigger audit_documentos_empleados
  after insert or update on public.documentos_empleados
  for each row execute function public.registrar_auditoria();

create index documentos_empleados_empleado_idx on public.documentos_empleados (empleado_id) where archived_at is null;
