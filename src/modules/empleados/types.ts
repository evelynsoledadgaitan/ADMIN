import type { Database } from '@/lib/supabase/database.types'

export type Empleado = Database['public']['Tables']['empleados']['Row']
export type ModalidadPagoEmpleado = Database['public']['Tables']['modalidades_pago_empleado']['Row']
export type DocumentoEmpleado = Database['public']['Tables']['documentos_empleados']['Row']
export type TipoDocumento = DocumentoEmpleado['tipo_documento']
export type PagoEmpleado = Database['public']['Tables']['pagos_empleados']['Row']
export type TipoPagoEmpleado = PagoEmpleado['tipo']
export type FrecuenciaPago = NonNullable<Empleado['frecuencia_pago']>

export const ETIQUETAS_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  dni: 'DNI',
  contrato: 'Contrato',
  apto_medico: 'Apto médico',
  cv: 'CV',
  certificado: 'Certificado',
  otro: 'Otro'
}

/**
 * Puramente informativo (pedido explícito: "sin cálculos automáticos") —
 * no dispara ningún monto ni ninguna fecha de vencimiento, es un dato más
 * para leer en la Ficha.
 */
export const ETIQUETAS_FRECUENCIA_PAGO: Record<FrecuenciaPago, string> = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
  por_hora: 'Por hora',
  por_jornada: 'Por jornada',
  otro: 'Otro'
}

/**
 * Qué documentos hacen falta para considerar "completa" la
 * documentación de un empleado (Sprint 4A, punto de la Ficha) — decisión
 * propia, no pedida explícitamente: DNI y Contrato son los dos que
 * asumo indispensables; Apto médico/CV/Certificado/Otro quedan como
 * complementarios, no afectan el indicador. Es una constante de una sola
 * línea — si el criterio real es otro, se ajusta acá sin tocar nada más.
 */
export const DOCUMENTOS_REQUERIDOS: TipoDocumento[] = ['dni', 'contrato']

export interface EmpleadoFormValues {
  nombre_apellido: string
  cargo: string
  modalidad_pago_id: string
  valor: number | null
  frecuencia_pago: FrecuenciaPago | ''
}

export const EMPLEADO_FORM_VACIO: EmpleadoFormValues = {
  nombre_apellido: '',
  cargo: '',
  modalidad_pago_id: '',
  valor: null,
  frecuencia_pago: ''
}

export function empleadoAFormValues(empleado: Empleado): EmpleadoFormValues {
  return {
    nombre_apellido: empleado.nombre_apellido,
    cargo: empleado.cargo ?? '',
    modalidad_pago_id: empleado.modalidad_pago_id ?? '',
    valor: empleado.valor,
    frecuencia_pago: empleado.frecuencia_pago ?? ''
  }
}

export interface DocumentoFormValues {
  tipo_documento: TipoDocumento | ''
  descripcion_otro: string
}

export function valoresDocumentoVacio(): DocumentoFormValues {
  return { tipo_documento: '', descripcion_otro: '' }
}

export interface PagoEmpleadoFormValues {
  /** El monto "de base" — lo que le corresponde antes de cualquier descuento. Es lo que ve y edita el usuario; lo que se guarda en la base es `monto - descuento` (ver useRegistrarPagoEmpleado). */
  monto: number | null
  fecha: string // ISO yyyy-mm-dd
  concepto: string
  medio_pago_id: string
  numero_comprobante: string
  descuento: number | null
  motivoDescuento: string
  /** Solo para modalidad "Por hora" — informativo, sugiere `monto` (horas × valor) pero no se guarda: el dato persistido es siempre el monto final. */
  horas: number | null
}

export function valoresPagoEmpleadoVacio(hoyISO: string): PagoEmpleadoFormValues {
  return {
    monto: null,
    fecha: hoyISO,
    concepto: '',
    medio_pago_id: '',
    numero_comprobante: '',
    descuento: null,
    motivoDescuento: '',
    horas: null
  }
}

/** `monto - descuento` — lo que efectivamente se le paga, y lo único que se guarda como `monto` en la base. Nunca negativo (se valida antes de guardar). */
export function montoFinalPago(valores: PagoEmpleadoFormValues): number {
  return (valores.monto ?? 0) - (valores.descuento ?? 0)
}
