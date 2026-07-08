# Comprobante adjunto — propuesta de interfaz (componente genérico)

No incluye implementación. Cubre los 8 puntos pedidos + la aclaración de arriba.

---

## 1. Nombre y alcance del componente

Ya que tiene que servir para cualquier adjunto futuro (Facturación, Empleados, Contador...), no se llama "Comprobante" ni vive en ningún módulo — dos piezas en `core/components/`:

- **`ArchivoAdjunto`** — el selector/preview que va *dentro* de un formulario (Registrar deuda, Ingreso, Movimiento, y cualquier futuro).
- **`VisorAdjunto`** — el visor de solo lectura que va en una pantalla de detalle (Estado de Cuenta, Ficha, diálogos de detalle).

Ninguno de los dos sabe qué es una "deuda" o un "movimiento" — reciben un archivo y ya, igual que `DataTable` no sabe qué es un cliente.

---

## 2. El campo dentro del formulario — los 3 estados

**Vacío** (estado por defecto — refuerza que es opcional):
```
┌─────────────────────────────────┐
│  📎  Adjuntar comprobante         │
│      PDF, JPG o PNG · Máx. 5 MB  │
└─────────────────────────────────┘
```
Un botón chico, discreto, con el límite ya escrito ahí (nadie tiene que adivinar). No es un cuadro grande ni obligatorio-looking — es la última fila del formulario, después de todos los campos con datos reales.

**Imagen elegida** — miniatura real del archivo, no un ícono genérico:
```
┌───────────┐
│ [miniatura]│  Cambiar · Quitar
│  120×120   │
└───────────┘
```

**PDF elegido** — ícono + nombre + peso, sin miniatura (un PDF no se previsualiza así):
```
┌─────────────────────────────────┐
│  📄  factura-julio.pdf            │
│      842 KB          Cambiar · Quitar │
└─────────────────────────────────┘
```

"Cambiar" reabre el selector de archivos (reemplaza la elección actual por una nueva, todavía sin guardar nada). "Quitar" vuelve al estado vacío. Ninguno de los dos toca el servidor — hasta que se aprieta "Guardar" en el formulario, todo pasa en el navegador.

---

## 3. Tipos de archivo y límite de tamaño

**Acepta:** PDF, JPG/JPEG, PNG.

**Sobre HEIC** (lo mencionaste en tu último mensaje): técnicamente lo puedo aceptar en la carga, pero te aviso una limitación real antes de prometerlo — la mayoría de los navegadores (y casi todo Android, que es la prioridad del proyecto) no puede mostrar una miniatura de un archivo HEIC, solo Safari/iOS lo hace nativamente. El archivo se subiría y guardaría igual, pero en vez de la miniatura se vería un ícono genérico de imagen. Como HEIC es un formato específico de iPhone y el proyecto prioriza Android, mi sugerencia es no ofrecerlo como opción explícita por ahora (queda JPG/PNG/PDF) — si en la práctica alguien necesita subir una foto desde un iPhone, la mayoría los comparte ya convertidos a JPG. Decime si preferís incluirlo de todas formas.

**Límite de tamaño:** propongo **5 MB** — cómodo para una foto de celular o un PDF escaneado, sin arriesgar el espacio de Supabase Storage. Si se supera, error inmediato al elegir el archivo (antes de intentar subir nada): "El archivo supera el límite de 5 MB."

---

## 4. Cómo se ve desde el Estado de Cuenta y el detalle (solo lectura)

Dentro de cada fila del detalle de un movimiento, si tiene adjunto:

```
┌─────────────────────────────────┐
│  Importe        $15.000          │
│  Fecha           10/06/2026       │
│  ...                             │
│  Comprobante                     │
│  [miniatura 60×60]  Ver          │
└─────────────────────────────────┘
```

Tocar la miniatura (o "Ver", si es PDF) abre el archivo en una pestaña nueva, a tamaño completo — no hay que construir un visor propio de PDF ni un lightbox de imágenes, el navegador ya sabe mostrar ambos. Si el movimiento no tiene comprobante, esa fila directamente no aparece (no un "Sin comprobante" en gris ocupando espacio).

---

## 5. Arquitectura de almacenamito (breve, técnica)

Un único bucket de Supabase Storage (`adjuntos`, nombre genérico) para todo el sistema, organizado por tabla: `{tabla}/{id_del_registro}/{archivo}`. Las políticas de acceso al bucket reutilizan exactamente `tiene_permiso()` — quien puede ver una deuda, puede ver su comprobante; no es un permiso nuevo.

---

## 6. Nota sobre los mockups

El generador de imágenes no está respondiendo en este momento (falla técnica del lado de la herramienta, no del diseño). Los 3 estados del campo y el visor de detalle ya están representados arriba (secciones 2 y 4) con el detalle suficiente para aprobar la experiencia — apenas la herramienta vuelva a responder, te mando las versiones renderizadas como referencia visual final, sin que eso bloquee que empecemos a programar si ya te convence lo descripto.

## 7. Resumen para aprobar

| Punto | Propuesta |
|---|---|
| Selección | Botón discreto, opcional, con el límite ya escrito |
| Imagen elegida | Miniatura real (no ícono genérico) |
| PDF elegido | Ícono + nombre + peso (nunca miniatura) |
| Reemplazar/quitar | Solo antes de guardar — después, el registro es inmutable como todo lo demás |
| Ver desde detalle | Miniatura o botón "Ver" → abre en pestaña nueva, sin visor propio |
| Tipos aceptados | PDF, JPG, PNG — HEIC no incluido por ahora (ver nota arriba) |
| Límite | 5 MB |
| Reutilización | `ArchivoAdjunto` (formulario) + `VisorAdjunto` (detalle), en `core/`, sin saber nada de negocio |
