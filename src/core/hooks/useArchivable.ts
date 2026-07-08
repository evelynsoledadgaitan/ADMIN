import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/** Tablas de negocio que efectivamente tienen columna archived_at. */
type TablaArchivable =
  | 'clientes' | 'proveedores' | 'productos' | 'categorias_productos'
  | 'empleados' | 'documentos_empleados' | 'pagos_empleados'
  | 'condiciones_iva' | 'medios_pago' | 'modalidades_pago_empleado'
  | 'notas'

/**
 * Archivar un registro (nunca eliminar — regla no negociable del brief).
 * Setea archived_at = now(). El registro deja de aparecer en los listados
 * (que siempre filtran archived_at IS NULL) pero nunca se borra.
 *
 * Usar SIEMPRE este hook para archivar en cualquier módulo — así el
 * comportamiento de "archivar" es idéntico en toda la app.
 *
 * Nota técnica: el cast a `any` en la llamada a `.from()` es intencional.
 * El cliente tipado de supabase-js no resuelve bien sus tipos genéricos
 * cuando el nombre de tabla llega como parámetro genérico (en vez de un
 * literal fijo) — es una limitación conocida de la librería, no un
 * descuido. El contrato real de tipos queda garantizado por
 * `TablaArchivable` en la firma pública de este hook.
 */
export function useArchivable<T extends TablaArchivable>(tabla: T) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(tabla) as any)
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tabla] })
    }
  })
}
