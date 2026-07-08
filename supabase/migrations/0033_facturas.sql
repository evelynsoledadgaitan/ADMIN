-- 0033: Facturación interna (Bloque 3) — comprobante propio de ADMIN, sin
-- validez fiscal, integrado únicamente con Clientes y Cuenta Corriente
-- (ver docs/decisiones/0025 y docs/sistemas/bloque3-facturacion-diseno.md).
--
-- `facturas` es la cabecera (mismo patrón de inmutabilidad de siempre:
-- no se edita, solo se anula). `factura_items` son las líneas — cada una
-- es una FOTOGRAFÍA del producto al momento de facturar: `descripcion` y
-- `precio_unitario` se copian, no se leen en vivo de `productos`, para
-- que una factura vieja no cambie si el producto cambia después (mismo
-- principio que ya rige compras/deudas/movimientos).
--
-- `producto_id` es opcional: una línea puede ser un producto del catálogo
-- o un concepto libre tipeado a mano (decisión aprobada) — incluso
-- combinar ambos tipos en la misma factura.
--
-- Sin "condición de pago": documentar una operación (facturar) y
-- registrar un movimiento de dinero (cobrar) son procesos completamente
-- separados — toda factura genera su Deuda automáticamente, siempre; el
-- cobro se registra después, por separado, con el Motor de Pagos que ya
-- existe (decisión corregida antes de esta entrega).

create table public.facturas (
  id uuid primary key default gen_random_uuid(),

  numero_interno bigint generated always as identity unique,

  cliente_id uuid not null references public.clientes(id),

  fecha date not null default current_date check (fecha <= current_date),
  total numeric(12,2) not null check (total > 0),
  nota text,

  archived_at timestamptz,
  anulado_por uuid references public.usuarios(id),
  motivo_anulacion text,
  check (archived_at is null or anulado_por is not null),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.factura_items (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid not null references public.facturas(id) on delete cascade,
  producto_id uuid references public.productos(id), -- opcional: null = concepto libre

  descripcion text not null,
  cantidad numeric(12,2) not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null check (precio_unitario > 0),
  subtotal numeric(12,2) not null check (subtotal > 0),

  created_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.facturas
  for each row execute function public.set_updated_at();

create trigger audit_facturas
  after insert or update on public.facturas
  for each row execute function public.registrar_auditoria();

create index facturas_cliente_idx on public.facturas (cliente_id, fecha desc, created_at desc);
create index factura_items_factura_idx on public.factura_items (factura_id);
