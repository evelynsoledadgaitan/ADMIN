# 0026 — Bloque 1: CUIT real y comprobante adjunto

## Decisión

**CUIT**: `core/lib/cuit.ts` implementa el algoritmo real de dígito verificador (módulo 11), compartido por Clientes y Proveedores — reemplaza la validación de solo-longitud que existía desde el Sprint 2/4. No confirma que el CUIT exista en AFIP/ARCA (eso requeriría un servicio externo, descartado por la decisión `0025`), solo que tiene la forma matemática de un CUIT válido.

**Comprobante adjunto**: dos componentes genéricos en `core/components/` — `ArchivoAdjunto` (selector, dentro del formulario) y `VisorAdjunto` (solo lectura, en el detalle). Ninguno de los dos conoce ningún concepto de negocio. Bucket privado de Supabase Storage (`adjuntos`), acceso vía URL firmada de 5 minutos, protegido por las mismas políticas de `tiene_permiso()` que ya rigen el resto del sistema — la ruta de cada archivo (`{modulo}/{tabla}/{id}/{archivo}`) codifica el permiso que lo protege.

**Opcional siempre, inmutable después de guardar**: ningún formulario exige el adjunto. "Cambiar"/"Quitar" solo existen mientras se completa el formulario — una vez guardado el registro (Deuda, Ingreso, Movimiento), el adjunto queda fijo igual que el resto de sus datos, mismo criterio de inmutabilidad de siempre.

**Subida atómica con la creación del registro**: se genera un `id` en el cliente (`crypto.randomUUID()`) antes de insertar, se sube el archivo a esa ruta si existe, y recién con el `comprobante_path` ya resuelto se hace el único `insert`. Se evaluó y descartó "insertar primero, subir después, actualizar la fila" — hubiera significado dos viajes de red y una ventana breve donde el registro existe sin su adjunto todavía.

**Rotación EXIF automática**: la miniatura de una foto usa `createImageBitmap(archivo, { imageOrientation: 'from-image' })`, una API nativa del navegador — sin agregar ninguna librería nueva. Si falla por cualquier motivo, se muestra el archivo sin corregir (nunca bloquea la carga).

## Formatos y límites confirmados
PDF, JPG/JPEG, PNG. HEIC quedó afuera — no se previsualiza en la mayoría de los navegadores de Android, que es la prioridad del proyecto. Límite de 5 MB, igual en la validación del cliente y en el propio bucket de Storage (`file_size_limit`), como segunda defensa.

## Por qué

Es la aplicación directa de la propuesta de interfaz ya aprobada (`docs/sistemas/comprobante-adjunto-interfaz.md`), con los 3 ajustes pedidos incorporados: nombre y peso del archivo debajo de la miniatura, confirmación antes de quitar (reutiliza `useConfirm`, sin diálogo nuevo), y "Descargar" además de "Ver" en el visor (descarga real vía blob, no solo abrir en pestaña — necesario porque el atributo `download` de un link no funciona de forma confiable contra una URL de otro dominio, como la de Supabase Storage).

## Alcance de lo implementado
- Migración `0029`: bucket `adjuntos` + políticas de Storage.
- `core/lib/cuit.ts`, `core/lib/adjuntos.ts` (validación, subida, URL firmada, miniatura EXIF-corregida).
- `core/components/ArchivoAdjunto.tsx`, `core/components/VisorAdjunto.tsx`.
- Los 3 diálogos de alta (Deuda, Ingreso, Movimiento) suben el adjunto opcional; los 3 diálogos de detalle lo muestran.
- Validación de CUIT real en Clientes y Proveedores.

## Alternativas descartadas
- **HEIC**: se evaluó incluirlo (pedido explícitamente) y se descartó por la limitación real de vista previa en Android — documentado como pregunta al cliente antes de decidir, no como omisión silenciosa.
- **Confirmar que el CUIT existe en AFIP/ARCA**: fuera de alcance por decisión `0025` — la validación es puramente matemática (dígito verificador), no una consulta a un padrón fiscal real.
