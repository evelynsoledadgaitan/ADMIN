import { ListView } from './ListView'
import { useToast } from '@/core/hooks/useToast'
import type { ModuloInfo } from '@/core/theme/modulos'

/**
 * Pantalla inicial de un módulo que todavía no tiene funcionalidad de
 * negocio (Sprint 1 — esqueleto). Reutiliza el mismo ListView de siempre
 * con una lista vacía, para que la experiencia (buscador, FAB, mensaje de
 * vacío) sea IDÉNTICA a la que tendrá el módulo el día que se programe de
 * verdad. Nada de esto se reescribe en la siguiente etapa: cuando el
 * módulo tenga datos reales, solo se reemplaza `items={[]}` por la query.
 *
 * El FAB "+" nunca queda sin reacción al tocarlo: mientras el módulo no
 * esté implementado, avisa "Próximamente" en vez de no hacer nada —
 * ningún botón de ADMIN debería dar la sensación de estar roto.
 */
export function ModuleEmptyScreen({ modulo }: { modulo: ModuloInfo }) {
  const toast = useToast()

  return (
    <ListView
      listKey={modulo.key}
      items={[]}
      getKey={() => ''}
      getSearchableText={() => ''}
      renderItem={() => null}
      onAgregar={() => toast.info(`${modulo.nombre}: próximamente`)}
      placeholderBusqueda={`Buscar ${modulo.nombre.toLowerCase()}...`}
      emptyState={`No hay ${modulo.nombreSingular}.`}
    />
  )
}
