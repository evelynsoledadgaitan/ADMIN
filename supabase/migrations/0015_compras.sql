-- 0015: Compras a proveedores (Sprint 4). Es el origen de la deuda hacia
-- un proveedor — el pago (Motor de Pagos, Sprint 3) es su consecuencia,
-- nunca al revés. Mismo criterio de inmutabilidad aprobado para
-- `movimientos`: una compra no se edita, solo se anula.

create table public.compras (
  id uuid primary key default gen_random_uuid(),

  -- Número interno visible para el usuario (COMP-000001), igual criterio
  -- que `movimientos.numero_interno` — no reemplaza al id (observación A).
  numero_interno bigint generated always as identity unique,

  proveedor_id uuid not null references public.proveedores(id),

  descripcion text not null,          -- obligatoria (decisión aprobada, punto 4)
  numero_comprobante text,            -- factura/remito del proveedor, dato externo, sin formato propio
  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default current_date check (fecha <= current_date), -- sin fechas futuras (punto 5)

  -- Preparado para adjuntar factura/remito/comprobante escaneado más
  -- adelante (observación D) — sin implementar la carga todavía, mismo
  -- criterio que `movimientos.comprobante_path` (Sprint 3).
  comprobante_path text,

  -- Anulación (nunca edición) — mismo mecanismo que `movimientos`: se
  -- reutiliza `archived_at` a propósito para que el trigger genérico de
  -- auditoría lo detecte como 'archive' automáticamente, sin mecanismos
  -- paralelos (ver docs/decisiones/0014).
  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.compras
  for each row execute function public.set_updated_at();

create trigger audit_compras
  after insert or update on public.compras
  for each row execute function public.registrar_auditoria();

-- Orden cronológico estable (observación C): fecha desc y, en empate,
-- created_at desc — el índice cubre exactamente ese order by.
create index compras_proveedor_idx on public.compras (proveedor_id, fecha desc, created_at desc);
