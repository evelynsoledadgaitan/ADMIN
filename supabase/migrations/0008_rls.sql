-- 0008: Row Level Security.
-- Regla del proyecto: "el usuario mantiene siempre el control" y los
-- permisos son por módulo y por acción. Todas las policies delegan en
-- tiene_permiso() (0003) en vez de repetir lógica de rol/permiso acá.

alter table public.usuarios enable row level security;
alter table public.permisos enable row level security;
alter table public.clientes enable row level security;
alter table public.proveedores enable row level security;
alter table public.productos enable row level security;
alter table public.historial_precios enable row level security;
alter table public.configuracion enable row level security;
alter table public.audit_log enable row level security;
alter table public.condiciones_iva enable row level security;
alter table public.categorias_productos enable row level security;
alter table public.estados_cheque enable row level security;
alter table public.modalidades_pago_empleado enable row level security;

-- usuarios: cualquier usuario logueado puede leer su propia fila y la de
-- otros (para ver "quién hizo qué" en historiales); solo el admin gestiona.
create policy usuarios_select on public.usuarios for select
  using (auth.uid() is not null);
create policy usuarios_admin_write on public.usuarios for all
  using (public.tiene_permiso('usuarios', 'ver') or (select rol from public.usuarios where id = auth.uid()) = 'admin')
  with check ((select rol from public.usuarios where id = auth.uid()) = 'admin');

-- permisos: el usuario ve los suyos; solo el admin los crea/edita.
create policy permisos_select_propio on public.permisos for select
  using (usuario_id = auth.uid() or (select rol from public.usuarios where id = auth.uid()) = 'admin');
create policy permisos_admin_write on public.permisos for all
  using ((select rol from public.usuarios where id = auth.uid()) = 'admin')
  with check ((select rol from public.usuarios where id = auth.uid()) = 'admin');

-- Catálogos: lectura para cualquier usuario logueado; escritura según
-- permiso de "configuracion" (los catálogos se administran ahí).
create policy catalogos_select_condiciones_iva on public.condiciones_iva for select using (auth.uid() is not null);
create policy catalogos_write_condiciones_iva on public.condiciones_iva for all
  using (public.tiene_permiso('configuracion', 'modificar')) with check (public.tiene_permiso('configuracion', 'modificar'));

create policy catalogos_select_categorias on public.categorias_productos for select using (auth.uid() is not null);
create policy catalogos_write_categorias on public.categorias_productos for all
  using (public.tiene_permiso('configuracion', 'modificar')) with check (public.tiene_permiso('configuracion', 'modificar'));

create policy catalogos_select_estados_cheque on public.estados_cheque for select using (auth.uid() is not null);
create policy catalogos_write_estados_cheque on public.estados_cheque for all
  using (public.tiene_permiso('configuracion', 'modificar')) with check (public.tiene_permiso('configuracion', 'modificar'));

create policy catalogos_select_modalidades_pago on public.modalidades_pago_empleado for select using (auth.uid() is not null);
create policy catalogos_write_modalidades_pago on public.modalidades_pago_empleado for all
  using (public.tiene_permiso('configuracion', 'modificar')) with check (public.tiene_permiso('configuracion', 'modificar'));

-- Clientes
create policy clientes_select on public.clientes for select using (public.tiene_permiso('clientes', 'ver'));
create policy clientes_insert on public.clientes for insert with check (public.tiene_permiso('clientes', 'crear'));
create policy clientes_update on public.clientes for update
  using (public.tiene_permiso('clientes', 'modificar') or public.tiene_permiso('clientes', 'archivar'))
  with check (public.tiene_permiso('clientes', 'modificar') or public.tiene_permiso('clientes', 'archivar'));

-- Proveedores
create policy proveedores_select on public.proveedores for select using (public.tiene_permiso('proveedores', 'ver'));
create policy proveedores_insert on public.proveedores for insert with check (public.tiene_permiso('proveedores', 'crear'));
create policy proveedores_update on public.proveedores for update
  using (public.tiene_permiso('proveedores', 'modificar') or public.tiene_permiso('proveedores', 'archivar'))
  with check (public.tiene_permiso('proveedores', 'modificar') or public.tiene_permiso('proveedores', 'archivar'));

-- Productos
create policy productos_select on public.productos for select using (public.tiene_permiso('productos', 'ver'));
create policy productos_insert on public.productos for insert with check (public.tiene_permiso('productos', 'crear'));
create policy productos_update on public.productos for update
  using (public.tiene_permiso('productos', 'modificar') or public.tiene_permiso('productos', 'archivar'))
  with check (public.tiene_permiso('productos', 'modificar') or public.tiene_permiso('productos', 'archivar'));

create policy historial_precios_select on public.historial_precios for select using (public.tiene_permiso('productos', 'ver'));

-- Configuración
create policy configuracion_select on public.configuracion for select using (public.tiene_permiso('configuracion', 'ver'));
create policy configuracion_write on public.configuracion for all
  using (public.tiene_permiso('configuracion', 'modificar')) with check (public.tiene_permiso('configuracion', 'modificar'));

-- audit_log: de solo lectura desde la app, nunca se escribe manualmente
-- (lo hacen los triggers con security definer). Visible según permiso de
-- "informes", que es donde vivirá la consulta de historial.
create policy audit_log_select on public.audit_log for select using (public.tiene_permiso('informes', 'ver'));
