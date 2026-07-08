# Notas: diseño funcional y técnico

Documento de diseño. No incluye implementación. Mismas 4 preguntas de siempre.

Marco: el módulo más chico del roadmap — anotar cosas pendientes del negocio, sin categorías, prioridades, colores, etiquetas ni nada que no pediste.

---

## 1. ¿Qué reutiliza de lo que ya existe?

- **`ListView`/`DataTable`, `EstadoFiltroTabs`, `useArchivable`/`useRestaurar`**: mismo patrón de listado que cualquier otro módulo.
- **`HistorialAuditoria`**: se puede sumar sin ningún trabajo extra (es un trigger que ya existe, `registrar_auditoria()` — solo hay que engancharlo a la tabla nueva).
- **El patrón "Pendientes" en Inicio**, ya generalizado con Facturación y Contador — una nota con recordatorio próximo o vencido es, ni más ni menos, una tercera fuente de esa misma sección.
- **`useArchivable` ya es más simple de lo que pensás**: lo revisé antes de escribir esto — no exige motivo ni quién archivó, solo pone la fecha. Encaja con "sin complejidad" sin que haga falta tocar nada.

---

## 2. ¿Qué tablas nuevas necesita?

Una sola.

```
notas:
  id, titulo (obligatorio), descripcion (opcional),
  fecha (opcional), recordatorio (opcional),
  realizada (sí/no, por defecto no),
  archived_at, created_at, updated_at
```

`fecha` y `recordatorio` son dos campos distintos, tal como los separaste en tu pedido: `fecha` es "para cuándo es esto" (informativo), `recordatorio` es "avisame de esto" (dispara la tarjeta en Inicio). Los dos son opcionales e independientes — una nota puede tener los dos, uno solo, o ninguno.

---

## 3. Una decisión real que necesito que tomes vos — antes de las pantallas

Hasta ahora, **todo** en ADMIN sigue la misma regla: nada se edita, todo se anula. Es la base de que se pueda confiar en el historial de cualquier módulo financiero. Notas es distinto por naturaleza — no es un comprobante ni un movimiento de dinero, es un anotador rápido. Corregir un typo en el título anulando la nota entera y creando una nueva de nuevo sería ir en contra de "simple y rápido", que es exactamente lo que pediste para este módulo.

**Propongo que Notas sea la primera excepción explícita**: se puede editar directamente (título, descripción, fecha, recordatorio) — sin anular, sin motivo, sin historial de versiones. Archivar sigue existiendo para sacarla de la vista principal, y "marcar como realizada" es un simple sí/no, independiente de archivar.

¿Estás de acuerdo con esta excepción, o preferís que Notas siga exactamente la misma regla de inmutabilidad que el resto (editar = anular la vieja y cargar una nueva)?

---

## 4. ¿Qué pantallas incorpora?

- **Listado de Notas** (`/notas`): buscador (por título y descripción), pestañas Activas/Archivadas — dentro de Activas, cada nota muestra un check para marcarla como realizada (tachada visualmente cuando está hecha, sin desaparecer de la lista).
- **Un único diálogo** para crear y editar (no una pantalla aparte) — se abre igual para "nueva nota" que para tocar una existente, mismo patrón que "Registrar vencimiento" de Contador. Título, Descripción, Fecha, Recordatorio — cuatro campos, nada más.

No hay Ficha separada — para algo tan simple, una pantalla de detalle propia sería la complejidad que pediste evitar.

---

## 5. ¿Qué impacto tiene sobre el resto del sistema?

- **Ninguno sobre otro módulo** — autocontenido, mismo criterio que Empleados y Contador.
- **Inicio**: tercera fuente de "Pendientes" (notas con recordatorio de hoy o vencido) — la sección ya está armada para admitir más de una fuente a la vez, desde que se sumó Contador.
- **Permisos**: `notas` ya estaba previsto como módulo de permiso desde la Fase 0.

---

## Resumen de lo que necesito confirmar

1. La excepción a la inmutabilidad (sección 3) — es la única decisión de fondo de todo este módulo.
2. Si te sirve el diseño de "un solo diálogo para crear y editar", sin pantalla de detalle separada.
