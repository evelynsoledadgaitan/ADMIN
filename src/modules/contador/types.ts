import type { Database } from '@/lib/supabase/database.types'

export type Obligacion = Database['public']['Tables']['obligaciones_contador']['Row']
export type TipoObligacion = Obligacion['tipo']
export type DocumentoContador = Database['public']['Tables']['documentos_contador']['Row']
export type TipoDocumentoContador = DocumentoContador['tipo_documento']

/** Lenguaje visible: "Vencimiento" en vez de "Obligación" (decisión aprobada) — el nombre técnico de la tabla no cambió. */
export const ETIQUETAS_TIPO: Record<TipoObligacion, string> = {
  impuesto: 'Impuesto',
  honorario: 'Honorario',
  otro: 'Otro'
}

export const ETIQUETAS_TIPO_DOCUMENTO_CONTADOR: Record<TipoDocumentoContador, string> = {
  contrato_servicios: 'Contrato de servicios',
  poder: 'Poder',
  constancia_inscripcion: 'Constancia de inscripción',
  otro: 'Otro'
}

/**
 * Estado — nunca se guarda, se calcula siempre en el momento comparando
 * fechas (decisión aprobada de diseño). "Próxima a vencer" es un cuarto
 * estado explícito, pedido para que tenga su propio color — no alcanza
 * con Pendiente/Vencida/Pagada.
 */
export type EstadoVencimiento = 'pagada' | 'vencida' | 'proxima_a_vencer' | 'pendiente'

export const ETIQUETAS_ESTADO_VENCIMIENTO: Record<EstadoVencimiento, string> = {
  pagada: 'Pagado',
  vencida: 'Vencido',
  proxima_a_vencer: 'Próximo a vencer',
  pendiente: 'Pendiente'
}

/** Días de anticipación para considerar un vencimiento "próximo a vencer" — propuesto 7, sin objeción. */
export const DIAS_PROXIMO_A_VENCER = 7

export function calcularEstadoVencimiento(obligacion: Pick<Obligacion, 'fecha_pago' | 'fecha_vencimiento'>, hoyISO: string): EstadoVencimiento {
  if (obligacion.fecha_pago !== null) return 'pagada'
  if (obligacion.fecha_vencimiento < hoyISO) return 'vencida'

  const hoy = new Date(hoyISO)
  const vencimiento = new Date(obligacion.fecha_vencimiento)
  const diasRestantes = Math.round((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (diasRestantes <= DIAS_PROXIMO_A_VENCER) return 'proxima_a_vencer'
  return 'pendiente'
}

export interface VencimientoFormValues {
  tipo: TipoObligacion
  concepto: string
  monto: number | null
  fecha_vencimiento: string // ISO yyyy-mm-dd
  nota: string
}

export function valoresVencimientoVacio(hoyISO: string): VencimientoFormValues {
  return { tipo: 'impuesto', concepto: '', monto: null, fecha_vencimiento: hoyISO, nota: '' }
}

export interface MarcarPagadaFormValues {
  fecha_pago: string
}

export interface DocumentoContadorFormValues {
  tipo_documento: TipoDocumentoContador | ''
  descripcion_otro: string
}

export function valoresDocumentoContadorVacio(): DocumentoContadorFormValues {
  return { tipo_documento: '', descripcion_otro: '' }
}
