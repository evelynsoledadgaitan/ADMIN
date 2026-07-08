-- 0012: Motor de Pagos (Sprint 3) — registro de hechos (cobros y pagos).
-- No calcula saldos ni interpreta deuda: esa es responsabilidad del futuro
-- módulo "Cuenta Corriente" (ver docs/sistemas/motor-de-pagos-arquitectura.md,
-- sección 3). Acá solo se registra qué movimiento de dinero ocurrió.
--
-- Alcance de este Sprint: conectado únicamente a Clientes (cobros) y
-- Proveedores (pagos) — Empleados y Contador se suman cuando esos módulos
-- existan, con una migración que agrega su columna + amplía el CHECK de
-- abajo, sin tocar ninguna fila existente.
--
-- Inmutabilidad (decisión aprobada): un movimiento nunca se edita. Solo se
-- puede anular. Se reutiliza el nombre de columna `archived_at` (igual que
-- clientes/proveedores/productos) a propósito: así el trigger genérico de
-- auditoría (registrar_auditoria(), Fase 0) detecta la anulación como
-- 'archive' automáticamente, sin tener que tocar ese trigger ni el CHECK
-- de `audit_log.accion` — un único sistema de auditoría, sin mecanismos
-- paralelos (punto E, observaciones del cliente). En la interfaz esto se
-- llama "Anular", nunca "Archivar" — es el verbo correcto para dinero.

create table public.movimientos (
  id uuid primary key default gen_random_uuid(),

  -- Número interno visible para el usuario (MOV-000001). No reemplaza al
  -- id — es una referencia legible para consultas y soporte (observación B).
  numero_interno bigint generated always as identity unique,

  tipo text not null check (tipo in ('cobro', 'pago')),
  cliente_id uuid references public.clientes(id),
  proveedor_id uuid references public.proveedores(id),

  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default current_date,
  medio_pago_id uuid not null references public.medios_pago(id),

  -- Preparado para cuando exista el módulo Cheques — sin FK todavía porque
  -- la tabla `cheques` no existe (ver sección 6 del documento de arquitectura).
  cheque_id uuid,

  -- Preparado para adjuntar comprobante (transferencia, recibo, escaneo) —
  -- sin implementar la carga todavía (observación A). Cuando se implemente,
  -- es una ruta dentro de un bucket de Supabase Storage.
  comprobante_path text,

  nota text,

  -- Anulación (nunca edición — ver arriba).
  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (tipo = 'cobro' and cliente_id is not null and proveedor_id is null)
    or
    (tipo = 'pago' and proveedor_id is not null and cliente_id is null)
  ),

  -- Fecha no futura (decisión aprobada, punto 4): un movimiento representa
  -- una operación efectivamente realizada, no un pago programado.
  check (fecha <= current_date),

  -- No se puede marcar anulado sin dejar registrado quién lo hizo.
  check (archived_at is null or anulado_por is not null)
);

create trigger set_updated_at
  before update on public.movimientos
  for each row execute function public.set_updated_at();

create trigger audit_movimientos
  after insert or update on public.movimientos
  for each row execute function public.registrar_auditoria();

create index movimientos_cliente_idx on public.movimientos (cliente_id, fecha desc) where cliente_id is not null;
create index movimientos_proveedor_idx on public.movimientos (proveedor_id, fecha desc) where proveedor_id is not null;
