# 0002 — Auditoría por triggers de PostgreSQL

## Decisión
El registro de auditoría ("toda operación queda registrada. Nunca podrá perderse.") se implementa **en la base de datos**, mediante una función genérica `registrar_auditoria()` adjunta como trigger `AFTER INSERT OR UPDATE` a cada tabla de negocio. Los resultados se guardan en una única tabla `audit_log` (ver migración `0006_auditoria.sql`).

## Por qué
Si la auditoría se implementara en el frontend (cada componente hace su propio `insert` a una tabla de historial después de guardar), la garantía "nunca podrá perderse" depende de que **cada** desarrollador, en **cada** módulo, para siempre, recuerde agregar ese código. Un solo olvido rompe la garantía para ese módulo.

Con triggers a nivel de base de datos:
- Cualquier escritura queda registrada sin importar por dónde entre (la app, una importación masiva, una corrección manual en el panel de Supabase).
- Un módulo nuevo solo necesita **una línea** en su migración (`create trigger audit_<tabla> ...`) para heredar la garantía completa.
- El registro distingue automáticamente un archivado (`archived_at` pasa de `NULL` a una fecha) de una edición común, para que el historial hable en los mismos términos que el negocio.

## Alternativas descartadas
- **Auditoría desde el frontend**: descartada por el motivo anterior — no es robusta a errores humanos ni a escrituras fuera de la app.
- **Tabla de auditoría por módulo** (`clientes_historial`, `productos_historial`, etc.): descartada por duplicar diez veces la misma estructura; una tabla única (`audit_log`) con columna `tabla` permite un único punto de consulta para informes y un único índice a mantener.
