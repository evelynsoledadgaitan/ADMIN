# 0018 — Importación de productos: un único UPSERT en la base, no un loop en el frontend

## Decisión
`importar_productos(jsonb)` es una función de PostgreSQL que recibe el archivo ya parseado y validado (sin filas con error) y hace un único `INSERT ... ON CONFLICT (codigo_barras) DO UPDATE ... WHERE ...` sobre todas las filas de una vez. La cláusula `WHERE` del `DO UPDATE` hace que **no se escriba nada** en un producto si nada cambió (mismo precio, mismo nombre, ya estaba activo) — evita disparar el trigger de auditoría y actualizar `updated_at` sin necesidad.

El parseo del CSV, la identificación de columnas por nombre y la validación fila por fila ocurren en el frontend (`csvParser.ts`) — a la función de base de datos solo llegan filas limpias.

## Por qué

**Un solo UPSERT en vez de un loop:** es la aplicación directa de la decisión aprobada del Sprint 5 (observación E) y del mismo criterio que ya se usó en el listado de Clientes (Sprint 2, `docs/decisiones/0012`) — cualquier operación sobre muchas filas debe resolverse en la base de datos, no con cientos o miles de llamadas desde el navegador. Con un archivo de varios miles de productos, la diferencia entre una sentencia y miles de round-trips de red es la diferencia entre segundos y minutos.

**`WHERE` condicional en el `DO UPDATE`:** el cliente fue explícito — "no quiero generar escrituras innecesarias" (punto 3 de su aprobación). Sin esa condición, cada fila del archivo generaría un `UPDATE` (y por lo tanto una entrada de auditoría) aunque el precio y el nombre fueran idénticos a los que ya estaban guardados — puro ruido en el historial de un producto que en los hechos no cambió.

**Parseo y validación en el frontend, no en la función SQL:** identificar columnas por nombre con tolerancia a mayúsculas/acentos/espacios (punto 2 aprobado) es lógica de texto que es mucho más simple de escribir y de testear en TypeScript que en PL/pgSQL. La función de base de datos se mantiene enfocada en una sola cosa (el UPSERT masivo), consistente con cómo se diseñó `saldo_proveedor()` en el Sprint 4.

## Alternativas descartadas
- **Insertar/actualizar fila por fila desde el frontend** (un `INSERT` o `UPDATE` de Supabase por cada fila del archivo): descartado explícitamente por el cliente y por ser, en la práctica, inviable con archivos de varios cientos o miles de productos.
- **Parsear y validar el CSV dentro de la función de PostgreSQL**: descartado porque PL/pgSQL no es un lenguaje cómodo para lógica de texto tolerante (normalización de nombres de columna, mensajes de error por fila) — hacerlo en TypeScript, donde además se puede mostrar la previsualización antes de tocar la base, es más simple y más seguro.
