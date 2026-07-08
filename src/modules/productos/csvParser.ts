import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { normalizarTexto } from '@/core/lib/utils'
import type { FilaImportacion, Producto } from './types'

/**
 * Identificación de columnas por nombre, no por posición (decisión
 * aprobada, punto 2): "codigo_barras", "Código Barras" y "CODIGO_BARRAS"
 * deben reconocerse como la misma columna. Se normaliza sacando acentos,
 * mayúsculas y cualquier separador (espacio, guión, guión bajo).
 *
 * Compartida entre CSV y Excel (Bloque 2) — el archivo de origen ya no
 * importa una vez que se convirtió a filas de texto, así que toda esta
 * lógica se escribe una sola vez.
 */
function normalizarNombreColumna(header: string): string {
  return normalizarTexto(header).replace(/[^a-z0-9]/g, '')
}

const ALIASES: Record<'codigo_barras' | 'nombre' | 'precio', string[]> = {
  codigo_barras: ['codigobarras', 'codigo', 'codbarras', 'ean', 'ean13', 'barcode'],
  nombre: ['nombre', 'descripcion', 'producto', 'detalle'],
  precio: ['precio', 'importe', 'preciounitario', 'preciolista', 'preciodeventa']
}

function encontrarColumna(headers: string[], campo: keyof typeof ALIASES): string | null {
  const normalizados = headers.map((h) => ({ original: h, normalizado: normalizarNombreColumna(h) }))
  const match = normalizados.find((h) => ALIASES[campo].includes(h.normalizado))
  return match?.original ?? null
}

/**
 * Interpreta un precio escrito en cualquier formato razonable, sin pedirle
 * al usuario que edite el archivo antes de subirlo (Bloque 2, punto 2):
 * símbolos de moneda ("$", "ARS"), separador de miles con punto o con
 * coma, y coma o punto como separador decimal. Ambigüedad clásica:
 * "1.234" puede ser mil doscientos treinta y cuatro (miles) o uno con
 * coma extraviada (decimal) — el criterio es: si hay un solo separador y
 * termina en exactamente 2 dígitos, se interpreta como decimal; si no, se
 * asume separador de miles y se descarta. Si aparecen los dos separadores
 * juntos, el que esté más a la derecha es el decimal (estándar en
 * cualquier formato: "1.234,56" o "1,234.56").
 */
export function normalizarPrecio(textoCrudo: string): number | null {
  let texto = textoCrudo.trim().replace(/[^\d.,-]/g, '')
  if (!texto) return null

  const tieneComa = texto.includes(',')
  const tienePunto = texto.includes('.')

  if (tieneComa && tienePunto) {
    const decimalEsComa = texto.lastIndexOf(',') > texto.lastIndexOf('.')
    texto = decimalEsComa ? texto.replace(/\./g, '').replace(',', '.') : texto.replace(/,/g, '')
  } else if (tieneComa) {
    const partes = texto.split(',')
    texto = partes[partes.length - 1].length === 2 ? partes.join('.') : texto.replace(/,/g, '')
  } else if (tienePunto) {
    const partes = texto.split('.')
    if (partes.length > 2 || partes[partes.length - 1].length !== 2) {
      texto = texto.replace(/\./g, '')
    }
  }

  const numero = Number(texto)
  return Number.isNaN(numero) ? null : numero
}

export interface ResultadoParseo {
  filas: FilaImportacion[]
  /** Errores de archivo (bloqueantes): archivo vacío o sin las columnas necesarias. */
  erroresArchivo: string[]
}

/**
 * Arma las filas ya validadas a partir de registros genéricos
 * (`{columna: valor}`) — no le importa si vinieron de un CSV o de un
 * Excel, esa diferencia ya se resolvió antes de llegar acá.
 */
function procesarRegistros(headers: string[], registros: Record<string, string>[]): ResultadoParseo {
  const columnaCodigo = encontrarColumna(headers, 'codigo_barras')
  const columnaNombre = encontrarColumna(headers, 'nombre')
  const columnaPrecio = encontrarColumna(headers, 'precio')

  const erroresArchivo: string[] = []
  if (registros.length === 0) erroresArchivo.push('El archivo no tiene ninguna fila de datos.')
  if (!columnaCodigo) erroresArchivo.push('No se encontró una columna de código de barras.')
  if (!columnaNombre) erroresArchivo.push('No se encontró una columna de nombre.')
  if (!columnaPrecio) erroresArchivo.push('No se encontró una columna de precio.')

  if (erroresArchivo.length > 0) {
    return { filas: [], erroresArchivo }
  }

  const filas: FilaImportacion[] = registros.map((fila, indice) => {
    const codigo_barras = String(fila[columnaCodigo as string] ?? '').trim()
    const nombre = String(fila[columnaNombre as string] ?? '').trim()
    const precio = normalizarPrecio(String(fila[columnaPrecio as string] ?? ''))

    let error: string | null = null
    if (!codigo_barras) error = 'Falta el código de barras.'
    else if (!nombre) error = 'Falta el nombre.'
    else if (precio === null || precio <= 0) error = 'El precio no es válido.'

    return {
      numeroFila: indice + 2, // +1 por la fila de encabezado, +1 porque el usuario cuenta desde 1
      codigo_barras,
      nombre,
      precio,
      error
    }
  })

  return { filas, erroresArchivo: [] }
}

/** Parsea un CSV de lista de precios (texto plano). */
export function parsearCSVProductos(textoArchivo: string): ResultadoParseo {
  const resultado = Papa.parse<Record<string, string>>(textoArchivo, {
    header: true,
    skipEmptyLines: true
  })
  return procesarRegistros(resultado.meta.fields ?? [], resultado.data)
}

/** Parsea un Excel (.xlsx) de lista de precios — primera hoja del libro. */
export function parsearExcelProductos(datos: ArrayBuffer): ResultadoParseo {
  const libro = XLSX.read(datos, { type: 'array' })
  const primeraHoja = libro.Sheets[libro.SheetNames[0]]
  const registros = XLSX.utils.sheet_to_json<Record<string, string>>(primeraHoja, { defval: '' })
  const headers = registros.length > 0 ? Object.keys(registros[0]) : []
  return procesarRegistros(headers, registros)
}

/**
 * Punto de entrada único para la pantalla de Importar lista (Bloque 2):
 * decide CSV o Excel según la extensión del archivo elegido, sin que la
 * pantalla tenga que saber nada de `Papa`/`XLSX`.
 */
export async function leerArchivoProductos(archivo: File): Promise<ResultadoParseo> {
  const esExcel = /\.xlsx?$/i.test(archivo.name)
  if (esExcel) {
    const buffer = await archivo.arrayBuffer()
    return parsearExcelProductos(buffer)
  }
  const texto = await archivo.text()
  return parsearCSVProductos(texto)
}

/** Arma el CSV descargable con las filas que tuvieron error. */
export function generarCSVErrores(filas: FilaImportacion[]): string {
  const conError = filas.filter((f) => f.error !== null)
  return Papa.unparse({
    fields: ['fila', 'codigo_barras', 'nombre', 'precio', 'error'],
    data: conError.map((f) => [f.numeroFila, f.codigo_barras, f.nombre, f.precio ?? '', f.error])
  })
}

export type ClasificacionFila = 'nuevo' | 'actualizado' | 'reactivado' | 'sin_cambios'

export interface FilaClasificada extends FilaImportacion {
  clasificacion: ClasificacionFila
  precioAnterior: number | null
}

/**
 * Clasifica cada fila válida cruzándola contra los productos ya
 * existentes — puramente informativo para la vista previa (Bloque 2,
 * punto 1: mostrar ejemplos de precio actual → precio nuevo antes de
 * confirmar). No decide nada por sí sola: la clasificación real y
 * definitiva la hace `importar_productos()` en la base al momento de
 * confirmar, esto es solo para que el usuario sepa qué esperar.
 */
export function clasificarFilas(filas: FilaImportacion[], productosActuales: Producto[]): FilaClasificada[] {
  const porCodigo = new Map(productosActuales.map((p) => [p.codigo_barras, p]))

  return filas.map((fila) => {
    if (fila.error !== null) {
      return { ...fila, clasificacion: 'sin_cambios', precioAnterior: null }
    }
    const existente = porCodigo.get(fila.codigo_barras)
    if (!existente) {
      return { ...fila, clasificacion: 'nuevo', precioAnterior: null }
    }
    if (existente.archived_at !== null) {
      return { ...fila, clasificacion: 'reactivado', precioAnterior: existente.precio_actual }
    }
    if (existente.precio_actual !== fila.precio || existente.nombre !== fila.nombre) {
      return { ...fila, clasificacion: 'actualizado', precioAnterior: existente.precio_actual }
    }
    return { ...fila, clasificacion: 'sin_cambios', precioAnterior: existente.precio_actual }
  })
}
