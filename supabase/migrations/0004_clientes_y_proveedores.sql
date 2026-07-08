-- 0004: Clientes y Proveedores.
-- Regla no negociable: nunca se elimina, se archiva (archived_at).
-- Nota sobre preparación multiempresa (docs/decisiones/0003): no se agrega
-- empresa_id todavía porque el proyecto es de un solo negocio, pero el
-- acceso a estas tablas pasa siempre por src/lib/supabase (cliente único) y
-- por tiene_permiso(), así que agregar esa columna en el futuro implica
-- tocar migraciones + ese puñado de policies, no reescribir la app.

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_apellido text not null, -- único campo obligatorio
  factura_config text not null default 'preguntar'
    check (factura_config in ('siempre', 'nunca', 'preguntar')),
  razon_social text,
  cuit text,
  condicion_iva_id uuid references public.condiciones_iva(id),
  domicilio_fiscal text,
  email text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

create index clientes_nombre_idx on public.clientes (nombre_apellido) where archived_at is null;

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  razon_social text,
  cuit text,
  condicion_iva_id uuid references public.condiciones_iva(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.proveedores
  for each row execute function public.set_updated_at();

create index proveedores_nombre_idx on public.proveedores (nombre) where archived_at is null;
