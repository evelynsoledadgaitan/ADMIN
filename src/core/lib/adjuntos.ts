import { supabase } from '@/lib/supabase/client'

/**
 * Comprobante adjunto — utilidad compartida por todo el sistema (ver
 * docs/sistemas/comprobante-adjunto-interfaz.md). Un único bucket
 * ('adjuntos') para cualquier documento de cualquier módulo, presente o
 * futuro. La ruta de cada archivo codifica el permiso que lo protege:
 *
 *   {modulo}/{tabla}/{registroId}/{archivo}
 *
 * — donde `modulo` es exactamente el mismo string que ya usa
 * `tiene_permiso()` ('clientes', 'proveedores', etc.), así las políticas
 * de Storage se escriben una sola vez y alcanzan para todo lo que venga
 * después (Facturación, Empleados...) con solo agregar una rama más.
 */

export const TIPOS_ACEPTADOS = ['application/pdf', 'image/jpeg', 'image/png'] as const
export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024 // 5 MB

const EXTENSIONES_POR_TIPO: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png'
}

export function esImagen(tipo: string): boolean {
  return tipo === 'image/jpeg' || tipo === 'image/png'
}

export function formatearTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Devuelve el mensaje de error si el archivo no es válido, o null si está OK. */
export function validarArchivoAdjunto(archivo: File): string | null {
  if (!TIPOS_ACEPTADOS.includes(archivo.type as (typeof TIPOS_ACEPTADOS)[number])) {
    return 'Solo se aceptan PDF, JPG o PNG.'
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return `El archivo supera el límite de ${formatearTamano(TAMANO_MAXIMO_BYTES)}.`
  }
  return null
}

export async function subirAdjunto(modulo: string, tabla: string, registroId: string, archivo: File): Promise<string> {
  const extension = EXTENSIONES_POR_TIPO[archivo.type] ?? 'bin'
  const ruta = `${modulo}/${tabla}/${registroId}/comprobante.${extension}`
  const { error } = await supabase.storage.from('adjuntos').upload(ruta, archivo, { upsert: true })
  if (error) throw error
  return ruta
}

/** URL temporal (5 minutos) para ver/descargar — el bucket es privado, protegido por RLS de Storage. */
export async function urlFirmadaAdjunto(ruta: string): Promise<string> {
  const { data, error } = await supabase.storage.from('adjuntos').createSignedUrl(ruta, 60 * 5)
  if (error) throw error
  return data.signedUrl
}

/**
 * Corrige la rotación EXIF de una foto de celular antes de mostrar la
 * miniatura — `createImageBitmap` con `imageOrientation: 'from-image'` es
 * una API nativa del navegador (Chrome/Firefox/Safari ya la soportan),
 * sin agregar ninguna librería nueva. Si algo falla (formato raro,
 * navegador viejo), se devuelve el archivo original tal cual — nunca
 * bloquea la carga por esto, es solo una mejora de la vista previa.
 */
export async function generarMiniaturaCorregida(archivo: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return URL.createObjectURL(archivo)
    ctx.drawImage(bitmap, 0, 0)
    return canvas.toDataURL(archivo.type)
  } catch {
    return URL.createObjectURL(archivo)
  }
}
