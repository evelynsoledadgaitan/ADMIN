-- 0020: historial de importaciones de listas de precios (Sprint 5,
-- observación B). No guarda el archivo original — solo los números del
-- resultado, para auditoría y soporte. Es, en sí misma, una tabla de
-- historial (como audit_log): no se le adjunta el trigger genérico de
-- auditoría porque no tendría sentido auditar un registro que ya es,
-- él mismo, un registro de auditoría de una operación — nadie la edita
-- ni la archiva, solo se inserta una fila por cada importación.

create table public.importaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id),
  cantidad_procesados int not null,
  cantidad_creados int not null,
  cantidad_actualizados int not null,
  cantidad_reactivados int not null,
  cantidad_errores int not null,
  created_at timestamptz not null default now()
);

create index importaciones_created_at_idx on public.importaciones (created_at desc);

alter table public.importaciones enable row level security;

create policy importaciones_select on public.importaciones for select
  using (public.tiene_permiso('productos', 'ver'));

create policy importaciones_insert on public.importaciones for insert
  with check (public.tiene_permiso('productos', 'crear'));
