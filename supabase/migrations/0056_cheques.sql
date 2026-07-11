-- 0056: Cheques (quinto y último ítem del documento "Mejoras para
-- implementar en ADMIN"). Ver docs/sistemas/cheques-diseno.md.
--
-- Decisión central (aprobada): Cheques no es una cuenta corriente
-- paralela — es una capa de datos específicos (banco, número, titular,
-- fechas, estado, foto) apoyada en el Motor de Pagos que ya existe.
-- Recibir un cheque = un cobro normal; entregarlo a un proveedor = un
-- pago normal — `movimiento_cobro_id`/`movimiento_pago_id` son el mismo
-- mecanismo de vínculo que ya usa `facturas.movimiento_id` (Flujo B).
--
-- `estado` es un campo real que se guarda — a diferencia del resto de
-- ADMIN (Facturación, Contador), acá no hay forma de derivarlo: que un
-- banco acredite o rechace algo es información externa, alguien tiene
-- que cargarla. Es la primera excepción justificada a "nunca guardar lo
-- que se puede calcular".
--
-- Sin `archived_at`: "Anulado" es uno de los 6 estados, no un archivado
-- aparte — un cheque anulado sigue visible en su propia pestaña de
-- filtro, nunca se esconde (decisión aprobada explícita, distinta del
-- patrón Activos/Archivados que usa el resto del sistema).
--
-- El "historial automático" pedido no necesita ninguna tabla nueva: es
-- el mismo trigger de auditoría que ya usan Clientes/Proveedores/
-- Empleados/Contador (`registrar_auditoria()`), aplicado acá.

create table public.cheques (
  id uuid primary key default gen_random_uuid(),

  banco text not null,
  numero text not null,
  importe numeric(12,2) not null check (importe > 0),
  titular text not null,
  cuit text,
  fecha_emision date not null,
  fecha_vencimiento date not null,

  estado text not null default 'disponible' check (
    estado in ('disponible', 'entregado', 'depositado', 'acreditado', 'rechazado', 'anulado')
  ),
  observaciones text,
  comprobante_path text,

  cliente_id uuid not null references public.clientes(id),
  proveedor_id uuid references public.proveedores(id),
  movimiento_cobro_id uuid not null references public.movimientos(id),
  movimiento_pago_id uuid references public.movimientos(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.cheques
  for each row execute function public.set_updated_at();

create trigger audit_cheques
  after insert or update on public.cheques
  for each row execute function public.registrar_auditoria();

create index cheques_vencimiento_idx on public.cheques (fecha_vencimiento) where estado = 'disponible';
create index cheques_cliente_idx on public.cheques (cliente_id);
create index cheques_proveedor_idx on public.cheques (proveedor_id) where proveedor_id is not null;
