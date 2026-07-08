-- 0001: extensiones y funciones auxiliares comunes a todo el proyecto.

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- Mantiene updated_at siempre actualizado, sin depender de que el frontend
-- lo mande. Se reutiliza en todas las tablas con updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger genérico: actualiza updated_at en cada UPDATE. Usar en toda tabla que tenga esa columna.';
