# 0005 — Permisos por módulo y por acción

## Decisión
La tabla `permisos` tiene una fila por combinación `(usuario, módulo)`, con cuatro columnas booleanas: `puede_ver`, `puede_crear`, `puede_modificar`, `puede_archivar`. El admin no tiene filas en esta tabla — su acceso total se resuelve por `rol = 'admin'` directamente en `tiene_permiso()`.

Tanto el frontend (`usePermissions`) como la base de datos (políticas de RLS) consultan la **misma** fuente de verdad a través de la función `tiene_permiso(modulo, accion)`, para que nunca puedan quedar desincronizados un permiso que el frontend cree que existe y uno que la base de datos realmente aplica.

## Por qué
El cliente definió explícitamente que la granularidad mínima es ver/crear/modificar/archivar por módulo, sin necesitar algo más fino (por ejemplo, por campo) en la versión 1.

Es importante que el frontend **no** sea la única barrera: si solo se ocultara un botón en la interfaz pero la base de datos aceptara la escritura igual, cualquiera con las herramientas de desarrollador del navegador podría saltarse el permiso. Por eso la misma regla vive en RLS, que es lo que de verdad protege los datos.

## Alternativas descartadas
- **Permisos como un array/JSON libre en la tabla `usuarios`** (ej. `permisos: {"clientes": ["ver", "crear"]}`): descartado porque hace mucho más difícil escribir políticas de RLS eficientes y consultables sobre esa estructura, comparado con una tabla relacional simple.
- **Permisos por campo** (ej. puede ver el CUIT de un cliente pero no su email): descartado por el cliente mismo como innecesario para la v1. Si hiciera falta en el futuro, se agrega como una tabla adicional sin tocar la estructura actual.
