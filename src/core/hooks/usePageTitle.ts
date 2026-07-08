import { useEffect } from 'react'
import { usePageTitleContext } from '@/core/components/pageTitle/PageTitleProvider'

/**
 * Anuncia el título de la pantalla actual a la TopBar. Se limpia solo al
 * desmontar (vuelve al nombre del módulo por defecto).
 *
 * Ejemplo: usePageTitle('Nuevo cliente')
 * Ejemplo con dato asincrónico: usePageTitle(cliente?.nombre_apellido ?? null)
 *   — mientras `cliente` es null (todavía está cargando), la TopBar cae al
 *   nombre del módulo; en cuanto llega el dato, el título se actualiza solo.
 */
export function usePageTitle(titulo: string | null) {
  const { setTitulo } = usePageTitleContext()

  useEffect(() => {
    setTitulo(titulo)
    return () => setTitulo(null)
  }, [titulo, setTitulo])
}
