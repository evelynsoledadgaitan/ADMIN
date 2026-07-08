-- 0009: validaciones de formato para Clientes (Sprint 2), aprobadas en
-- docs/sistemas/modulo-clientes-arquitectura.md sección 5. Defensa en
-- profundidad: el frontend ya valida esto, pero la base de datos no debe
-- depender exclusivamente de que el frontend se comporte bien.

alter table public.clientes
  add constraint clientes_email_formato
    check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

alter table public.clientes
  add constraint clientes_cuit_formato
    check (cuit is null or cuit ~ '^\d{11}$');

comment on constraint clientes_cuit_formato on public.clientes is
  'Solo valida longitud (11 dígitos), sin guiones. El dígito verificador de AFIP/ARCA queda fuera de alcance en esta versión (ver docs/sistemas/modulo-clientes-arquitectura.md, sección 4.3) — se puede agregar después sin cambiar la experiencia del usuario.';
