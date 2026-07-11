/**
 * Orden y filtro compartidos por los informes de saldo (Clientes,
 * Proveedores) — misma lógica para los dos, para no duplicarla. Todo
 * client-side, sobre datos que ya están cargados — sin ninguna consulta
 * nueva por cambiar de orden o de filtro.
 */

export type OrdenSaldo = 'mayor_deuda' | 'menor_deuda' | 'az' | 'za' | 'reciente' | 'antigua'

export const ETIQUETAS_ORDEN_SALDO: Record<OrdenSaldo, string> = {
  mayor_deuda: 'Mayor deuda',
  menor_deuda: 'Menor deuda',
  az: 'A-Z',
  za: 'Z-A',
  reciente: 'Más reciente actividad',
  antigua: 'Más antigua actividad'
}

export type FiltroSaldo = 'todos' | 'con_deuda' | 'a_favor' | 'sin_movimientos'

export const ETIQUETAS_FILTRO_SALDO: Record<FiltroSaldo, string> = {
  todos: 'Todos',
  con_deuda: 'Sólo con deuda',
  a_favor: 'Sólo saldo a favor',
  sin_movimientos: 'Sin movimientos'
}

export interface FilaConSaldo {
  nombre: string
  saldo: number
  ultimaActividad: string | null
}

export function filtrarPorSaldo<T extends FilaConSaldo>(
  filas: T[],
  filtro: FiltroSaldo,
  importeDesde: number | null,
  importeHasta: number | null
): T[] {
  return filas.filter((f) => {
    if (filtro === 'con_deuda' && f.saldo <= 0) return false
    if (filtro === 'a_favor' && f.saldo >= 0) return false
    if (filtro === 'sin_movimientos' && f.saldo !== 0) return false

    // Importe siempre en valor absoluto (decisión aprobada) — más
    // intuitivo que pedirle al usuario que piense en el signo.
    const abs = Math.abs(f.saldo)
    if (importeDesde !== null && abs < importeDesde) return false
    if (importeHasta !== null && abs > importeHasta) return false
    return true
  })
}

export function ordenarPorCriterio<T extends FilaConSaldo>(filas: T[], orden: OrdenSaldo): T[] {
  const copia = [...filas]
  switch (orden) {
    case 'mayor_deuda':
      return copia.sort((a, b) => b.saldo - a.saldo)
    case 'menor_deuda':
      return copia.sort((a, b) => a.saldo - b.saldo)
    case 'az':
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    case 'za':
      return copia.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es'))
    case 'reciente':
      return copia.sort((a, b) => (b.ultimaActividad ?? '').localeCompare(a.ultimaActividad ?? ''))
    case 'antigua':
      return copia.sort((a, b) => {
        // Sin actividad nunca es "la más antigua real" — se manda al final en vez de al principio.
        if (a.ultimaActividad === null) return 1
        if (b.ultimaActividad === null) return -1
        return a.ultimaActividad.localeCompare(b.ultimaActividad)
      })
  }
}
