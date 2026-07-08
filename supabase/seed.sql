-- Datos iniciales de catálogos. No es lógica de negocio, es contenido —
-- se puede editar libremente desde Configuración una vez que exista esa
-- pantalla, sin tocar migraciones.

insert into public.condiciones_iva (nombre, orden) values
  ('Responsable Inscripto', 1),
  ('Monotributista', 2),
  ('Exento', 3),
  ('Consumidor Final', 4);

insert into public.estados_cheque (nombre, orden) values
  ('Disponible', 1),
  ('Utilizado', 2),
  ('Devuelto', 3),
  ('Anulado', 4);

insert into public.modalidades_pago_empleado (nombre) values
  ('Por hora'),
  ('Importe fijo');
