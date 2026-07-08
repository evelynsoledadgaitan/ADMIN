-- 0011: catálogo de medios de pago (Motor de Pagos, Sprint 3). Mismo
-- patrón que el resto de los catálogos de la Fase 0 — editable sin deploy.

create table public.medios_pago (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

insert into public.medios_pago (nombre, orden) values
  ('Efectivo', 1),
  ('Transferencia', 2),
  ('Cheque', 3),
  ('Tarjeta', 4),
  ('Otro', 5);
