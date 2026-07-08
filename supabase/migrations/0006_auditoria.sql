-- 0006: Auditoría a nivel de base de datos (estándar aprobado del proyecto).
-- "Toda operación queda registrada. Nunca podrá perderse." — se implementa
-- con triggers en vez de en el frontend, para que valga sin importar quién
-- programe un módulo nuevo o si alguien edita datos directamente en el
-- panel de Supabase.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  usuario_id uuid references public.usuarios(id),
  accion text not null check (accion in ('insert', 'update', 'archive')),
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  fecha timestamptz not null default now()
);

create index audit_log_tabla_registro_idx on public.audit_log (tabla, registro_id, fecha desc);

-- Función genérica: se adjunta como trigger a cualquier tabla de negocio.
-- Distingue "archive" de "update" mirando si archived_at pasó de NULL a
-- un valor — así el historial de auditoría refleja el archivado como lo
-- que es semánticamente, no como un update genérico más.
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion text;
begin
  if tg_op = 'INSERT' then
    v_accion := 'insert';
    insert into public.audit_log (tabla, registro_id, usuario_id, accion, datos_nuevos)
    values (tg_table_name, new.id, auth.uid(), v_accion, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    if (to_jsonb(old) ? 'archived_at')
       and old.archived_at is null
       and new.archived_at is not null then
      v_accion := 'archive';
    else
      v_accion := 'update';
    end if;
    insert into public.audit_log (tabla, registro_id, usuario_id, accion, datos_anteriores, datos_nuevos)
    values (tg_table_name, new.id, auth.uid(), v_accion, to_jsonb(old), to_jsonb(new));
    return new;
  end if;
  return null;
end;
$$;

comment on function public.registrar_auditoria() is
  'Trigger genérico de auditoría. Adjuntar con: create trigger audit_<tabla> after insert or update on <tabla> for each row execute function public.registrar_auditoria();';

-- Se adjunta a cada tabla de negocio del MVP. Al agregar un módulo nuevo
-- (Cheques, Empleados, etc.) hay que agregar acá su propio trigger — es el
-- único paso manual que requiere el estándar de auditoría.
create trigger audit_clientes after insert or update on public.clientes
  for each row execute function public.registrar_auditoria();

create trigger audit_proveedores after insert or update on public.proveedores
  for each row execute function public.registrar_auditoria();

create trigger audit_productos after insert or update on public.productos
  for each row execute function public.registrar_auditoria();
