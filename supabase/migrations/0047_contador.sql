-- 0047: Bloque 4B — Contador. Organizador de vencimientos, honorarios,
-- impuestos y documentación — sin ningún cálculo automático, sin
-- integración con ARCA (ver docs/decisiones/0025 y
-- docs/sistemas/bloque4b-contador-diseno.md). Mismo patrón que Empleados:
-- módulo autocontenido, sin integración con ningún otro módulo.
--
-- El nombre técnico de la tabla es `obligaciones_contador` — el lenguaje
-- visible en la interfaz usa "Vencimiento" (decisión aprobada), mismo
-- criterio que "Compra" (tabla) / "Ingreso de mercadería" (pantalla).
--
-- Sin columna de estado: se calcula siempre en el momento, comparando
-- fechas (Pagada / Vencida / Próxima a vencer / Pendiente) — ni siquiera
-- hace falta un trigger, alcanza con comparar contra la fecha de hoy.

create table public.obligaciones_contador (
  id uuid primary key default gen_random_uuid(),

  tipo text not null check (tipo in ('impuesto', 'honorario', 'otro')),
  concepto text not null,
  monto numeric(12,2) check (monto is null or monto > 0),

  fecha_vencimiento date not null,
  fecha_pago date,
  comprobante_path text,
  nota text,

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.obligaciones_contador
  for each row execute function public.set_updated_at();

create trigger audit_obligaciones_contador
  after insert or update on public.obligaciones_contador
  for each row execute function public.registrar_auditoria();

create index obligaciones_contador_vencimiento_idx on public.obligaciones_contador (fecha_vencimiento) where archived_at is null;

-- Documentación general (no atada a un vencimiento puntual) — mismo
-- patrón que documentos_empleados: varios archivos a la vez, cada uno su
-- propia fila.
create table public.documentos_contador (
  id uuid primary key default gen_random_uuid(),

  tipo_documento text not null check (tipo_documento in ('contrato_servicios', 'poder', 'constancia_inscripcion', 'otro')),
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

create trigger audit_documentos_contador
  after insert or update on public.documentos_contador
  for each row execute function public.registrar_auditoria();
