import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/** Mismo universo de tablas que useArchivable — todo lo que se puede archivar, se puede restaurar. */
type TablaArchivable = 'clientes' | 'proveedores' | 'productos' | 'categorias_productos' | 'empleados' | 'condiciones_iva' | 'medios_pago' | 'modalidades_pago_empleado' | 'notas'

/**
 * Restaurar un registro archivado (Etapa 3, ronda de ajuste — "siempre
 * que el módulo lo permita"). Pone `archived_at` de vuelta en `NULL`. Sin
 * confirmación (a diferencia de archivar): es la contracara de una acción
 * reversible, agregar fricción ahí no suma seguridad.
 *
 * No hace falta ninguna política de RLS nueva: la que ya autoriza
 * "archivar" (`tiene_permiso(modulo, 'archivar')`) es un `UPDATE` sobre
 * la misma columna en cualquier dirección, así que ya cubre esto.
 */
export function useRestaurar<T extends TablaArchivable>(tabla: T) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(tabla) as any)
        .update({ archived_at: null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tabla] })
    }
  })
}
