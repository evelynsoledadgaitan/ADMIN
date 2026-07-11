import type { Database } from '@/lib/supabase/database.types'

export type Cheque = Database['public']['Tables']['cheques']['Row']
export type EstadoCheque = Cheque['estado']

export const ETIQUETAS_ESTADO_CHEQUE: Record<EstadoCheque, string> = {
  disponible: 'Disponible',
  entregado: 'Entregado',
  depositado: 'Depositado',
  acreditado: 'Acreditado',
  rechazado: 'Rechazado',
  anulado: 'Anulado'
}

export interface ChequeFormValues {
  banco: string
  numero: string
  importe: number | null
  titular: string
  cuit: string
  fecha_emision: string // ISO yyyy-mm-dd
  fecha_vencimiento: string
  cliente_id: string
  observaciones: string
}

export function valoresChequeVacio(hoyISO: string, clienteId = ''): ChequeFormValues {
  return {
    banco: '',
    numero: '',
    importe: null,
    titular: '',
    cuit: '',
    fecha_emision: hoyISO,
    fecha_vencimiento: hoyISO,
    cliente_id: clienteId,
    observaciones: ''
  }
}
