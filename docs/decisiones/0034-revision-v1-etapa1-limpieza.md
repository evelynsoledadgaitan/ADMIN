# 0034 — Revisión integral v1.0: Etapa 1 (limpieza interna)

## Decisión

Primera de 3 etapas de la revisión integral previa a producción (informes de UX y de optimización interna, ambos aprobados). Sin funcionalidad nueva, sin cambios de arquitectura, sin cambios de flujo — solo limpieza.

**Código muerto eliminado**: `core/hooks/useAuditedMutation.ts` y `core/theme/tokens.ts` — ninguno de los dos tenía una sola importación en todo el proyecto. `tokens.ts` además contradecía el valor real usado en `vite.config.ts` (`theme_color`), así que además de no usarse podía inducir a error a quien lo mirara pensando que era la fuente de verdad.

**Utilidades centralizadas** — 3 funciones, copiadas de forma idéntica en varios módulos, ahora viven en un solo lugar:
- `hoyISO()`: 6 copias → `core/lib/format.ts`.
- `hayErrores()`: 6 copias → `core/lib/validacion.ts` (nuevo archivo).
- `normalizarParaOrden()`: 4 copias → `core/lib/texto.ts` (nuevo archivo).

Dos casos que **parecían** duplicados y se dejaron sin tocar, a propósito: `hayErroresFactura` (Facturación) tiene lógica propia para validar líneas, no es una copia de `hayErrores`; y `hayErrores` de Pagos usa una implementación distinta (`Object.keys().length > 0` en vez de `Object.values().some()`) — se comporta igual en la práctica, pero no es texto idéntico, así que no se tocó sin confirmar que el cambio es 100% seguro.

**Un detalle técnico del propio proceso de centralización**: los `validaciones.ts` que además de re-exportar `hoyISO` la usan dentro de su propia lógica de validación necesitaron `import` + `export` (no alcanza con `export { X } from 'Y'`, que no crea una variable utilizable en el mismo archivo) — se detectó con `tsc`, antes de esta entrega, no después.

**Validaciones agregadas en Configuración**: `DatosNegocioForm` (nombre obligatorio, formato de email si se completa) y `NumeracionForm` (ningún prefijo puede quedar vacío) — eran los dos únicos formularios de todo el sistema sin ninguna validación.

**Badge de Archivado/Anulado unificado**: `core/components/BadgeArchivado.tsx`, dos variantes (`BadgeArchivado` para Fichas, `BadgeArchivadoChico` para filas de listado) que reemplazan 10 copias del mismo bloque de clases repartidas en 10 archivos. Mismo aspecto visual exacto que cada una tenía — la unificación no cambia nada de lo que se ve, salvo una inconsistencia menor ya corregida (a `ListadoEmpleados` le faltaba `shrink-0` respecto a los otros 3 listados, ahora los 4 son iguales).

## Por qué

Aplica los puntos de Etapa 1 de los dos informes ya aprobados (UX y optimización interna), en el orden acordado.

## Alcance de lo implementado
- 2 archivos eliminados, 3 archivos nuevos en `core/lib/`, 1 componente nuevo en `core/components/`.
- 18 archivos con una copia local de utilidad reemplazada por el import centralizado.
- 10 archivos con el badge de archivado/anulado unificado.
- 2 formularios de Configuración con validación nueva.
- Sin migraciones — cambios exclusivamente de código.
