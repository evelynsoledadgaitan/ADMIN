/**
 * Libro de Cuenta Corriente — combina Cargos (Deudas/Ingresos de
 * mercadería), Pagos (Motor de Pagos) y Ajustes en una única línea de
 * tiempo con saldo acumulado. Es una función de presentación pura — no
 * consulta nada, no conoce Supabase, solo ordena y suma lo que ya se
 * cargó (ver docs/sistemas/reorganizacion-flujo-operativo.md, sección 6).
 *
 * Orden cronológico ASCENDENTE (lo más viejo arriba) — decisión aprobada,
 * es la única lista de toda la app que no muestra "más reciente primero",
 * a propósito: un saldo acumulado que baja línea por línea no se lee bien.
 *
 * Los movimientos anulados se muestran igual (nunca desaparecen), pero no
 * afectan el saldo acumulado — mismo criterio que ya usa saldo_cliente()/
 * saldo_proveedor() en la base de datos (`archived_at is null`). Así el
 * número que se ve acá siempre coincide con el que devuelve la función SQL.
 */
export interface FilaLibroCC {
  id: string
  fecha: string // ISO yyyy-mm-dd
  createdAt: string // ISO timestamp — desempate de orden en la misma fecha
  concepto: string
  debe: number | null
  haber: number | null
  anulado: boolean
  /**
   * Insignia chica opcional junto al concepto — hoy solo la usan las
   * Deudas ("Facturada"/"Sin factura"), calculada en el momento a partir
   * de si tienen `factura_id`, sin guardar ningún dato nuevo (decisión
   * aprobada, ver docs/decisiones/0029-bloque3-facturacion.md, adenda del
   * tercer flujo).
   */
  badge?: { texto: string; tono: 'exito' | 'advertencia' }
}

export interface FilaLibroConSaldo extends FilaLibroCC {
  saldoAcumulado: number
}

export function construirLibroCC(filas: FilaLibroCC[]): FilaLibroConSaldo[] {
  const ordenadas = [...filas].sort((a, b) => {
    const porFecha = a.fecha.localeCompare(b.fecha)
    if (porFecha !== 0) return porFecha
    return a.createdAt.localeCompare(b.createdAt)
  })

  let saldo = 0
  return ordenadas.map((fila) => {
    if (!fila.anulado) {
      saldo += (fila.debe ?? 0) - (fila.haber ?? 0)
    }
    return { ...fila, saldoAcumulado: saldo }
  })
}
