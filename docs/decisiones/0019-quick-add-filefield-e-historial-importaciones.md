# 0019 — Categorías por quick-add, FileField genérico, e historial de importaciones

## Decisión

**Categorías "creadas manualmente":** se resuelven con una extensión al componente `Select` del Design System (prop `onCrearOpcion`), no con una pantalla de administración de categorías. Al elegir "+ Nueva categoría" dentro del selector, este se reemplaza momentáneamente por un campo de texto para crearla sin salir del formulario de Alta/Modificación de producto.

**`FileField` generalizado:** el componente que hasta el Sprint 5 solo sabía mostrar una previsualización de imagen (pensado para la foto de un cheque) ahora detecta automáticamente si el archivo elegido es una imagen o no, y muestra un "chip" con el nombre del archivo en el segundo caso. La decisión de qué mostrar es automática (mira `file.type`), no una prop nueva que cada consumidor tenga que setear.

**Historial de importaciones (`importaciones`):** una tabla de solo inserción (nadie la edita ni la archiva) con usuario, fecha/hora y los cuatro contadores del resumen (creados, actualizados, reactivados, errores). No se le adjunta el trigger genérico de auditoría — sería auditar un registro que ya es, en sí mismo, un registro de auditoría de una operación.

## Por qué

**Quick-add en el `Select` en vez de una pantalla de categorías:** ninguno de los catálogos existentes (condición IVA, medios de pago, estados de cheque) tiene todavía una pantalla de administración propia, y el brief nunca pidió una para categorías tampoco — solo que se puedan crear "manualmente". Resolverlo en el momento en que hace falta (dentro del formulario de producto) evita construir una pantalla entera para una necesidad chica, y además queda como una pieza reutilizable: cualquier catálogo futuro con el mismo problema la aprovecha gratis.

**Generalizar `FileField` en vez de crear un componente paralelo para CSV:** la alternativa (un `DocumentField` nuevo, aparte) hubiera duplicado casi toda la lógica de manejo de archivo (input oculto, botón, mostrar/quitar) por una sola diferencia real (cómo se previsualiza). Detectar el tipo de archivo automáticamente resuelve esto con cero superficie nueva de API — y dado que Compras y Movimientos ya tienen una columna `comprobante_path` reservada desde los Sprints 3 y 4, este mismo componente generalizado es exactamente lo que se va a necesitar el día que se implemente esa carga.

**`importaciones` sin trigger de auditoría:** el propósito de la tabla es, en sí mismo, ser un registro histórico de una operación masiva — auditar su propia inserción no aporta nada que la tabla no cuente ya por definición (quién, cuándo, qué pasó). Es el mismo razonamiento por el que `audit_log` no se audita a sí mismo.

## Alternativas descartadas
- **Pantalla dedicada "Gestionar categorías"**: descartada por no estar pedida y por no ser consistente con cómo se maneja hoy ningún otro catálogo del sistema — se puede agregar después sin romper nada si hace falta editar o eliminar una categoría existente.
- **Guardar el archivo CSV original de cada importación**: el cliente fue explícito en que no hace falta — solo los números del resultado.
