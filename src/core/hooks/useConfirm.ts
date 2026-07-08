import { useConfirmContext } from '@/core/components/confirm/ConfirmDialogProvider'

/**
 * Hook público para pedir confirmación antes de una acción importante.
 *
 * Ejemplo:
 *   const confirmar = useConfirm()
 *   const ok = await confirmar({
 *     titulo: 'Archivar cliente',
 *     mensaje: 'El cliente dejará de aparecer en los listados. No se elimina.',
 *     accionConfirmar: 'archivar'
 *   })
 *   if (ok) { ... }
 */
export function useConfirm() {
  const { confirmar } = useConfirmContext()
  return confirmar
}
