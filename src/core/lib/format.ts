/**
 * Formateadores compartidos — moneda y fecha en es-AR. Antes vivían
 * duplicados dentro de ListaMovimientos; a partir de Proveedores (Sprint
 * 4) los usa más de un módulo, así que se centralizan acá.
 */
const formateadorMonedaInstance = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const formateadorFechaInstance = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' })

export function formatearMoneda(monto: number): string {
  return formateadorMonedaInstance.format(monto)
}

/** Acepta tanto "yyyy-mm-dd" (columnas `date` de Postgres) como timestamps ISO completos. */
export function formatearFecha(fecha: string): string {
  return formateadorFechaInstance.format(new Date(fecha))
}

/**
 * La fecha de hoy en "yyyy-mm-dd", en la zona horaria local (no UTC) —
 * para precargar el campo Fecha de un formulario y para el tope `max` que
 * evita cargar una fecha futura. Centralizada acá (Etapa 1 de limpieza
 * interna) — antes estaba copiada, carácter por carácter, en 6 módulos.
 */
export function hoyISO(): string {
  const hoy = new Date()
  const offset = hoy.getTimezoneOffset()
  return new Date(hoy.getTime() - offset * 60_000).toISOString().slice(0, 10)
}
