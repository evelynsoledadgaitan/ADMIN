import { useToastContext } from '@/core/components/toast/ToastProvider'

/**
 * Hook público para disparar un Snackbar desde cualquier componente.
 *
 * Ejemplo:
 *   const toast = useToast()
 *   toast.exito('Cliente guardado')
 *   toast.error('No se pudo archivar el cliente')
 */
export function useToast() {
  const { mostrar } = useToastContext()
  return {
    exito: (mensaje: string) => mostrar('exito', mensaje),
    advertencia: (mensaje: string) => mostrar('advertencia', mensaje),
    error: (mensaje: string) => mostrar('error', mensaje),
    info: (mensaje: string) => mostrar('info', mensaje)
  }
}
