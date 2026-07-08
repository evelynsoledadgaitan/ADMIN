import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Movimiento } from '@/modules/pagos/types'
import type { PagoEmpleado } from '@/modules/empleados/types'

/**
 * Consultas propias de Informes — mismas tablas de siempre
 * (`movimientos`, `pagos_empleados`), sin filtrar por una entidad
 * puntual. Todo lo demás que necesita el módulo (facturas, saldos,
 * vencimientos) ya tenía una versión "de todos" y se reutiliza tal cual,
 * sin ningún hook nuevo — ver docs/sistemas/informes-diseno.md.
 */

export function useTodosLosMovimientos(tipo: 'cobro' | 'pago') {
  return useQuery({
    queryKey: ['informes', 'movimientos', tipo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movimientos')
        .select('*, cliente:clientes(nombre_apellido), proveedor:proveedores(nombre)')
        .eq('tipo', tipo)
        .is('archived_at', null)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as (Movimiento & { cliente: { nombre_apellido: string } | null; proveedor: { nombre: string } | null })[]
    }
  })
}

export function useTodosLosPagosEmpleados() {
  return useQuery({
    queryKey: ['informes', 'pagos_empleados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pagos_empleados')
        .select('*, empleado:empleados(nombre_apellido)')
        .is('archived_at', null)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data as (PagoEmpleado & { empleado: { nombre_apellido: string } | null })[]
    }
  })
}
