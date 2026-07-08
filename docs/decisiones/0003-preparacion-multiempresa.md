# 0003 — Preparación para un eventual modelo multiempresa

## Decisión
La versión 1 de ADMIN **no** implementa multiempresa: no hay columna `empresa_id` en ninguna tabla, no hay lógica de tenant en el frontend. Se decidió, en cambio, concentrar **todo** el acceso a datos en dos puntos únicos:

1. Un solo cliente de Supabase (`src/lib/supabase/client.ts`), que ningún módulo debe duplicar.
2. Una sola función de autorización en la base de datos (`tiene_permiso()`), de la que dependen todas las políticas de RLS.

## Por qué
El cliente pidió explícitamente no agregar complejidad innecesaria ahora, pero dejar la puerta abierta a una migración futura sin reescribir la aplicación. La forma de lograr eso **sin** construir multiempresa hoy es evitar que la lógica de "para qué negocio es este dato" quede dispersa en decenas de componentes.

Si en el futuro se decide dar soporte a más de un negocio, el trabajo se reduce a:
- Agregar `empresa_id` a las tablas de negocio (una migración).
- Agregar `empresa_id` a la condición de las políticas de RLS (que ya están centralizadas en un solo archivo de migraciones y ya pasan todas por `tiene_permiso()` — se extiende esa función, no se tocan 10 módulos).
- Agregar el contexto de "empresa activa" al `AuthProvider` (un solo archivo).

Ningún componente de un módulo de negocio necesitaría cambiar, porque ninguno construye sus propias queries "a mano" fuera de `core/hooks` y `lib/supabase`.

## Alternativas descartadas
- **Agregar `empresa_id` desde ahora con una sola fila fija**: descartado por ser complejidad especulativa que el cliente pidió explícitamente evitar — agrega joins y condiciones en cada query sin ningún beneficio hoy.
- **No pensar en esto en absoluto**: descartado porque el costo de prevenirlo (mantener el acceso a datos centralizado) es prácticamente cero, mientras que el costo de no haberlo hecho, si algún día hace falta multiempresa, sería una reescritura completa.
