# 0027 — Bloque 2: Productos — categorías, Excel, importación tolerante

## Decisión

**Costo, margen y precio sugerido quedaron fuera** — se habían confirmado en una primera versión de este bloque y se revirtieron antes de programar nada (ver nota de reversión en la decisión `0025`). Productos se mantiene exclusivamente orientado a listas de precios.

**Categorías**: pasan a ser una entidad administrable completa (crear, editar, archivar, restaurar) — mismo patrón que cualquier entidad de datos maestros (`archived_at`, sin `anulado_por`/`motivo_anulacion`, que son propios de registros transaccionales inmutables). La pantalla vive dentro de Productos (`/productos/categorias`) porque Configuración todavía no es un módulo real — cuando lo sea, puede enlazar hacia acá sin reconstruir nada. Ninguna política de RLS nueva: el permiso de escritura sigue siendo `configuracion`, igual que el resto de los catálogos del sistema desde la Fase 0 (condiciones de IVA, medios de pago, etc.) — no se hizo una excepción para categorías aunque su pantalla viva en otro lugar.

**Excel**: se agregó `xlsx` (SheetJS) como dependencia. La detección de columnas por nombre (y sus alias) se escribió una sola vez y la comparten CSV y Excel — el formato de origen deja de importar apenas se convierte a filas de texto.

**Precio tolerante**: `normalizarPrecio()` interpreta símbolos de moneda, separador de miles (punto o coma) y separador decimal (punto o coma), sin pedirle al usuario que edite el archivo antes de subirlo.

**Vista previa con ejemplos**: antes de confirmar, se muestran hasta 5 productos que van a actualizar su precio, con precio anterior → precio nuevo. Es un cálculo de presentación (cruza las filas parseadas contra los productos ya cargados en memoria) — no dispara ninguna consulta nueva a Supabase, y no reemplaza el cálculo real y definitivo que sigue haciendo `importar_productos()` en la base al confirmar.

## Por qué

Es la aplicación directa del documento de diseño ya aprobado (`docs/sistemas/bloque2-productos-diseno.md`), con dos observaciones del proceso:

**Se auditó antes de diseñar y se encontró que 2 de los 7 pedidos originales ya estaban resueltos** (vista previa con nuevos/actualizados/errores desde el Sprint 5; búsqueda por nombre y código desde la Etapa 3) — evitó reprogramar algo que ya funcionaba.

**Costo/margen se revirtió sin dejar rastro ambiguo**: en vez de simplemente borrar la mención en la decisión `0025`, se dejó una nota explícita de que fue confirmado y después revertido — para que un futuro Sprint no interprete el silencio como un olvido y vuelva a proponerlo.

## Alcance de lo implementado
- Migración `0030`: `categorias_productos` archivable.
- `ListadoCategorias.tsx`, `CategoriaDialog.tsx`, hooks de categorías (activas/archivadas/crear/modificar), extendiendo `useArchivable`/`useRestaurar` a la nueva tabla.
- Enlace "Categorías" en el listado de Productos (desktop y celular), mismo lugar donde ya vivía "Importar lista" — sin tocar el resto de esa pantalla ni la Ficha, como se pidió explícitamente.
- `csvParser.ts`: `normalizarPrecio()`, soporte Excel (`parsearExcelProductos`, `leerArchivoProductos`), `clasificarFilas()` para la vista previa.
- `ImportarProductos.tsx`: acepta `.xlsx` además de `.csv`, muestra ejemplos de cambio de precio antes de confirmar.

## Alternativas descartadas
- **Costo/margen/precio sugerido**: confirmado y luego explícitamente descartado por el cliente — Productos no se ocupa de costos.
- **Permiso propio para categorías** (en vez de heredar `configuracion`): se evaluó dado que la pantalla vive en Productos, pero se descartó para no romper la consistencia del resto de los catálogos del sistema — todos comparten el mismo criterio de permiso desde la Fase 0.
