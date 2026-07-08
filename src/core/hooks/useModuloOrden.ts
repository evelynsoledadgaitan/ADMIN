import { useMemo } from 'react'
import type { ModuloInfo } from '@/core/theme/modulos'

/**
 * Estrategias de orden del Menú principal.
 *   'definido'   -> el orden manual de core/theme/modulos.ts (el actual).
 *   'alfabetico' -> por nombre. Ya funciona hoy (no depende de datos de uso).
 *   'frecuentes' -> por frecuencia de uso real del usuario. Placeholder:
 *                   todavía no existe ningún registro de qué módulo abre
 *                   más cada usuario, así que cae a 'definido' hasta que
 *                   se implemente ese tracking (probablemente junto con el
 *                   módulo de Usuarios, guardando contador de aperturas
 *                   por usuario y por módulo).
 *
 * Este Sprint solo deja preparado el mecanismo — la app sigue usando
 * 'definido' en todos lados. Cuando se implemente la opción real de
 * ordenar (probablemente un control en Configuración), alcanza con leer
 * la preferencia guardada y pasarla acá.
 */
export type EstrategiaOrdenMenu = 'definido' | 'alfabetico' | 'frecuentes'

export function useModuloOrden(modulos: ModuloInfo[], estrategia: EstrategiaOrdenMenu): ModuloInfo[] {
  return useMemo(() => {
    switch (estrategia) {
      case 'alfabetico':
        return [...modulos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      case 'frecuentes':
        // TODO: reemplazar por orden real de uso cuando exista el tracking.
        return modulos
      case 'definido':
      default:
        return modulos
    }
  }, [modulos, estrategia])
}
