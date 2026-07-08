-- 0007: Configuración general de la app (clave-valor).
create table public.configuracion (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.configuracion
  for each row execute function public.set_updated_at();
