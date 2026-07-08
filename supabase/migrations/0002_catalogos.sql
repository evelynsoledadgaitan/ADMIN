-- 0002: catálogos (tablas de referencia).
-- Se usan tablas en vez de ENUMs de Postgres a propósito: un ENUM requiere
-- una migración de esquema para agregar un valor nuevo; una fila en una
-- tabla de catálogo se agrega desde una pantalla de Configuración sin
-- tocar código. Esto responde directamente al riesgo de que la normativa
-- impositiva (condición frente al IVA) cambie con el tiempo.

create table public.condiciones_iva (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null default 0
);

create table public.categorias_productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table public.estados_cheque (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique, -- Disponible, Utilizado, Devuelto, Anulado
  orden int not null default 0
);

create table public.modalidades_pago_empleado (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique -- Por hora, Importe fijo
);

comment on table public.condiciones_iva is 'Catálogo editable — reemplaza un ENUM para que la normativa AFIP/ARCA se actualice sin deploy.';
