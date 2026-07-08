-- 0030: categorías de productos pasan a ser una entidad administrable
-- completa (crear, editar, archivar, restaurar) — Bloque 2. Mismo patrón
-- que cualquier entidad archivable "de datos maestros" (clientes,
-- proveedores, productos): solo `archived_at`, sin `anulado_por` ni
-- `motivo_anulacion` — esos campos son propios de registros transaccionales
-- inmutables (deudas, compras, movimientos, ajustes), no de un catálogo.
--
-- No hace falta ninguna política de RLS nueva: `catalogos_write_categorias`
-- (migración 0008) ya autoriza cualquier UPDATE sobre esta tabla con el
-- permiso 'configuracion' — mismo criterio que el resto de los catálogos
-- del sistema (condiciones_iva, medios_pago, etc.), sin excepción para
-- categorías aunque su pantalla de administración viva dentro de
-- Productos por ahora.

alter table public.categorias_productos
  add column archived_at timestamptz,
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

create trigger set_updated_at
  before update on public.categorias_productos
  for each row execute function public.set_updated_at();

create trigger audit_categorias_productos
  after insert or update on public.categorias_productos
  for each row execute function public.registrar_auditoria();
