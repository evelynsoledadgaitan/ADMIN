-- 0003: usuarios y permisos.
-- `usuarios` está 1:1 con auth.users (mismo id) — Supabase Auth maneja
-- credenciales; esta tabla guarda los datos de negocio del usuario.

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol text not null default 'usuario' check (rol in ('admin', 'usuario')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

-- Permisos por módulo y por acción (ver/crear/modificar/archivar), según
-- definición aprobada. El admin NO necesita filas acá: siempre tiene
-- acceso total (se resuelve por rol, no por esta tabla).
create table public.permisos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  modulo text not null check (modulo in (
    'clientes','proveedores','productos','cheques','empleados',
    'contador','notas','informes','usuarios','configuracion'
  )),
  puede_ver boolean not null default false,
  puede_crear boolean not null default false,
  puede_modificar boolean not null default false,
  puede_archivar boolean not null default false,
  unique (usuario_id, modulo)
);

-- Función central de autorización: TODA policy de RLS de este proyecto
-- llama a esta función en vez de repetir la lógica. Si mañana cambia cómo
-- se calculan los permisos, se cambia en un solo lugar.
create or replace function public.tiene_permiso(p_modulo text, p_accion text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rol text;
  v_permiso record;
begin
  select rol into v_rol from public.usuarios where id = auth.uid();

  if v_rol is null then
    return false; -- no logueado o no es un usuario de negocio
  end if;

  if v_rol = 'admin' then
    return true; -- el admin siempre tiene acceso total
  end if;

  select * into v_permiso from public.permisos
    where usuario_id = auth.uid() and modulo = p_modulo;

  if not found then
    return false;
  end if;

  return case p_accion
    when 'ver' then v_permiso.puede_ver
    when 'crear' then v_permiso.puede_crear
    when 'modificar' then v_permiso.puede_modificar
    when 'archivar' then v_permiso.puede_archivar
    else false
  end;
end;
$$;

comment on function public.tiene_permiso(text, text) is
  'Punto único de autorización. Toda policy de RLS del proyecto debe usar esta función, nunca repetir la lógica de rol/permisos.';
