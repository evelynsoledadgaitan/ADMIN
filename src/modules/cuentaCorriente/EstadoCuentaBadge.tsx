import { Skeleton } from '@/core/components/Skeleton'

const formateadorEstadoCuenta = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  signDisplay: 'exceptZero'
})

export type EstadoCuenta = 'deuda' | 'al_dia' | 'a_favor'

/**
 * Traduce el saldo interno (`saldo_cliente()`/`saldo_proveedor()`, donde
 * positivo siempre significa "hay una deuda pendiente en esta cuenta") al
 * signo que se muestra en pantalla — invertido a propósito. Es la misma
 * fórmula para Clientes y Proveedores: `mostrado = -saldo`.
 *
 * Por qué invertido: el saldo interno es "cuánto se le debe a quién"
 * desde la perspectiva del negocio (positivo = a favor del negocio en
 * Proveedores es distinto de Clientes — por eso el signo interno no es
 * directamente el que hay que mostrar). Lo que pediste es un lenguaje
 * único e inequívoco en pantalla: rojo y negativo siempre significa "hay
 * algo pendiente de saldar en esta cuenta", azul y positivo siempre
 * "saldo a favor" — sea cliente o proveedor. Esta función es el único
 * lugar donde se hace esa traducción, así que Clientes y Proveedores
 * quedan visualmente idénticos por construcción, no por convención.
 */
export function estadoCuentaDe(saldo: number): EstadoCuenta {
  const mostrado = -saldo
  if (mostrado === 0) return 'al_dia'
  return mostrado < 0 ? 'deuda' : 'a_favor'
}

/** Para ordenar la columna "Estado de cuenta" en DataTable — mismo signo que se muestra. */
export function valorOrdenEstadoCuenta(saldo: number): number {
  return -saldo
}

const COLOR_POR_ESTADO: Record<EstadoCuenta, string> = {
  deuda: 'text-error',
  al_dia: 'text-exito',
  a_favor: 'text-info'
}

/**
 * "🔴 −$importe / 🟢 $0,00 / 🔵 +$importe" — único componente para esta
 * representación, compartido por los listados de Clientes y Proveedores
 * (y cualquier futuro listado de cuenta corriente). Sin texto ("Debe",
 * "Al día", "A favor") a propósito — color y signo alcanzan.
 */
export function EstadoCuentaBadge({ saldo }: { saldo: number | undefined }) {
  if (saldo === undefined) {
    return <Skeleton className="ml-auto h-4 w-20" />
  }

  const estado = estadoCuentaDe(saldo)
  const mostrado = -saldo

  return (
    <span className={`font-semibold tabular-nums ${COLOR_POR_ESTADO[estado]}`}>
      {formateadorEstadoCuenta.format(mostrado)}
    </span>
  )
}
