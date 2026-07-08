-- 0005: Productos + historial de precios.
-- Regla: al importar una lista, si el código de barras ya existe, se
-- actualiza el precio y se mantiene la categoría; si el precio no cambió,
-- NO se registra una entrada nueva en el historial.

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo_barras text not null unique,
  nombre text not null,
  categoria_id uuid references public.categorias_productos(id),
  precio_actual numeric(12,2) not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

create index productos_nombre_idx on public.productos (nombre) where archived_at is null;
create index productos_codigo_idx on public.productos (codigo_barras);

create table public.historial_precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  precio numeric(12,2) not null,
  fecha timestamptz not null default now()
);

create index historial_precios_producto_idx on public.historial_precios (producto_id, fecha desc);

-- Regla de negocio "si el precio no cambió, no registrar" implementada acá
-- (base de datos), no en el frontend, para que valga sin importar si el
-- precio se actualiza por importación masiva, carga manual, o una futura
-- integración: cualquier UPDATE de precio_actual pasa por esta única regla.
create or replace function public.registrar_historial_precio()
returns trigger
language plpgsql
as $$
begin
  if new.precio_actual is distinct from old.precio_actual then
    insert into public.historial_precios (producto_id, precio)
    values (new.id, new.precio_actual);
  end if;
  return new;
end;
$$;

create trigger registrar_historial_precio
  after update of precio_actual on public.productos
  for each row execute function public.registrar_historial_precio();

-- También registrar el precio inicial al crear el producto.
create or replace function public.registrar_historial_precio_inicial()
returns trigger
language plpgsql
as $$
begin
  insert into public.historial_precios (producto_id, precio) values (new.id, new.precio_actual);
  return new;
end;
$$;

create trigger registrar_historial_precio_inicial
  after insert on public.productos
  for each row execute function public.registrar_historial_precio_inicial();
