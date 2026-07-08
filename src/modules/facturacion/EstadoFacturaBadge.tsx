import { ETIQUETAS_ESTADO_FACTURA, type EstadoFactura } from './types'

/** Insignia de estado — compartida entre el listado y la Ficha. Pendiente en ámbar (llama la atención, hay algo por hacer), Emitida en verde (completo). */
export function EstadoFacturaBadge({ estado }: { estado: EstadoFactura }) {
  const esEmitida = estado === 'emitida'
  return (
    <span
      className={
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
        (esEmitida ? 'bg-exito/10 text-exito' : 'bg-advertencia/10 text-advertencia')
      }
    >
      {ETIQUETAS_ESTADO_FACTURA[estado]}
    </span>
  )
}
