-- 0023: Deudas de Clientes — el "cargo" que le corresponde a Clientes,
-- gemela de `compras` (Proveedores, migración 0015), NO fusionada en una
-- tabla polimórfica — mismo criterio de integridad referencial que ya se
-- usó en el Motor de Pagos (ver docs/sistemas/cuenta-corriente-arquitectura-compartida.md).
--
-- Decisión aprobada (6.1): el origen de una deuda no se limita a una
-- venta — el comercio puede registrar deuda por "Cuenta del mes", una
-- venta puntual, una factura, u "Otro". `origen` es un CHECK (lista fija,
-- no un catálogo editable) porque son 4 conceptos que no se espera que el
-- usuario amplíe — si algún día hace falta un quinto, es una migración
-- de una línea.
--
-- Terminología (6.2): esta tabla se llama `deudas_clientes` a nivel de
-- base de datos porque es el término técnico correcto para el resto de
-- la arquitectura (mismo patrón que "cargo" en el documento de diseño) —
-- la interfaz nunca usa esta palabra, dice "Registrar deuda"/"Agregar
-- deuda".
--
-- Mismo criterio de inmutabilidad que compras/movimientos: no se edita,
-- solo se anula.

create table public.deudas_clientes (
  id uuid primary key default gen_random_uuid(),

  numero_interno bigint generated always as identity unique,

  cliente_id uuid not null references public.clientes(id),

  origen text not null check (origen in ('cuenta_mes', 'venta', 'factura', 'otro')),
  descripcion text not null,
  numero_comprobante text,
  monto numeric(12,2) not null check (monto > 0),
  fecha date not null default current_date check (fecha <= current_date),

  -- Mismo criterio que compras/movimientos: reservado, sin implementar la carga todavía.
  comprobante_path text,

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.deudas_clientes
  for each row execute function public.set_updated_at();

create trigger audit_deudas_clientes
  after insert or update on public.deudas_clientes
  for each row execute function public.registrar_auditoria();

create index deudas_clientes_cliente_idx on public.deudas_clientes (cliente_id, fecha desc, created_at desc);
