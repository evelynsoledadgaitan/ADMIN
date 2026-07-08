import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { subirAdjunto } from '@/core/lib/adjuntos'
import { montoFinalPago } from './types'
import type {
  Empleado,
  EmpleadoFormValues,
  ModalidadPagoEmpleado,
  DocumentoEmpleado,
  DocumentoFormValues,
  TipoDocumento,
  PagoEmpleado,
  PagoEmpleadoFormValues,
  TipoPagoEmpleado
} from './types'

// ---- Catálogo -------------------------------------------------------------

export function useModalidadesPago() {
  return useQuery({
    queryKey: ['modalidades_pago_empleado'],
    queryFn: async () => {
      const { data, error } = await supabase.from('modalidades_pago_empleado').select('*').is('archived_at', null).order('nombre')
      if (error) throw error
      return data as ModalidadPagoEmpleado[]
    }
  })
}

// ---- Empleado (dato maestro) ----------------------------------------------

export function useEmpleados() {
  return useQuery({
    queryKey: ['empleados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .is('archived_at', null)
        .order('nombre_apellido', { ascending: true })
      if (error) throw error
      return data as Empleado[]
    }
  })
}

export function useEmpleadosArchivados() {
  return useQuery({
    queryKey: ['empleados', 'archivados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .not('archived_at', 'is', null)
        .order('nombre_apellido', { ascending: true })
      if (error) throw error
      return data as Empleado[]
    }
  })
}

export function useEmpleado(id: string | undefined) {
  return useQuery({
    queryKey: ['empleados', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('empleados').select('*').eq('id', id as string).single()
      if (error) throw error
      return data as Empleado
    }
  })
}

export function useRegistrarEmpleado() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: EmpleadoFormValues) => {
      const { data, error } = await supabase
        .from('empleados')
        .insert({
          nombre_apellido: valores.nombre_apellido.trim(),
          cargo: valores.cargo.trim() === '' ? null : valores.cargo.trim(),
          modalidad_pago_id: valores.modalidad_pago_id === '' ? null : valores.modalidad_pago_id,
          valor: valores.valor,
          frecuencia_pago: valores.frecuencia_pago === '' ? null : valores.frecuencia_pago
        })
        .select()
        .single()
      if (error) throw error
      return data as Empleado
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empleados'] })
  })
}

export function useModificarEmpleado(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (valores: EmpleadoFormValues) => {
      const { data, error } = await supabase
        .from('empleados')
        .update({
          nombre_apellido: valores.nombre_apellido.trim(),
          cargo: valores.cargo.trim() === '' ? null : valores.cargo.trim(),
          modalidad_pago_id: valores.modalidad_pago_id === '' ? null : valores.modalidad_pago_id,
          valor: valores.valor,
          frecuencia_pago: valores.frecuencia_pago === '' ? null : valores.frecuencia_pago
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Empleado
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      queryClient.invalidateQueries({ queryKey: ['empleados', id] })
    }
  })
}

// ---- Documentación ---------------------------------------------------------

/** Documentos activos de un empleado — para la Ficha y el indicador de "documentación completa". */
export function useDocumentosEmpleado(empleadoId: string) {
  return useQuery({
    queryKey: ['documentos_empleados', empleadoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documentos_empleados')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .eq('empleado_id', empleadoId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (DocumentoEmpleado & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

export function useAgregarDocumento(empleadoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: DocumentoFormValues; archivo: File }) => {
      const id = crypto.randomUUID()
      const comprobante_path = await subirAdjunto('empleados', 'documentos_empleados', id, archivo)

      const { data, error } = await supabase
        .from('documentos_empleados')
        .insert({
          id,
          empleado_id: empleadoId,
          tipo_documento: valores.tipo_documento as TipoDocumento,
          descripcion_otro: valores.tipo_documento === 'otro' ? valores.descripcion_otro.trim() : null,
          comprobante_path
        })
        .select()
        .single()
      if (error) throw error
      return data as DocumentoEmpleado
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos_empleados', empleadoId] })
  })
}

export function useAnularDocumento(empleadoId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('documentos_empleados')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DocumentoEmpleado
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documentos_empleados', empleadoId] })
  })
}

// ---- Pagos y adelantos ------------------------------------------------------

export function usePagosEmpleado(empleadoId: string) {
  return useQuery({
    queryKey: ['pagos_empleados', empleadoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_empleados')
        .select('*, usuario_anulacion:usuarios(nombre)')
        .eq('empleado_id', empleadoId)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as (PagoEmpleado & { usuario_anulacion: { nombre: string } | null })[]
    }
  })
}

/** Último pago (o adelanto) del empleado — para el resumen de la Ficha, mismo criterio que "última compra/último pago" en Proveedores. */
export function useUltimoPagoEmpleado(empleadoId: string, tipo: TipoPagoEmpleado) {
  return useQuery({
    queryKey: ['pagos_empleados', empleadoId, 'ultimo', tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_empleados')
        .select('*')
        .eq('empleado_id', empleadoId)
        .eq('tipo', tipo)
        .is('archived_at', null)
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as PagoEmpleado | null
    }
  })
}

export function useRegistrarPagoEmpleado(empleadoId: string, tipo: TipoPagoEmpleado) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ valores, archivo }: { valores: PagoEmpleadoFormValues; archivo: File | null }) => {
      const id = crypto.randomUUID()
      const comprobante_path = archivo ? await subirAdjunto('empleados', 'pagos_empleados', id, archivo) : null

      const { data, error } = await supabase
        .from('pagos_empleados')
        .insert({
          id,
          empleado_id: empleadoId,
          tipo,
          monto: montoFinalPago(valores),
          fecha: valores.fecha,
          concepto: valores.concepto.trim(),
          medio_pago_id: valores.medio_pago_id === '' ? null : valores.medio_pago_id,
          numero_comprobante: valores.numero_comprobante.trim() === '' ? null : valores.numero_comprobante.trim(),
          descuento: valores.descuento,
          motivo_descuento: valores.descuento !== null ? valores.motivoDescuento.trim() : null,
          comprobante_path
        })
        .select()
        .single()
      if (error) throw error
      return data as PagoEmpleado
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos_empleados', empleadoId] })
    }
  })
}

export function useAnularPagoEmpleado(empleadoId: string) {
  const queryClient = useQueryClient()
  const { usuario } = useAuth()
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from('pagos_empleados')
        .update({
          archived_at: new Date().toISOString(),
          anulado_por: usuario?.id,
          motivo_anulacion: motivo.trim() === '' ? null : motivo.trim()
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PagoEmpleado
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pagos_empleados', empleadoId] })
  })
}
