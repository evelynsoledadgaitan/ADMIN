import { Wallet, Circle, HandCoins, Clock, CheckCircle2, XCircle, Ban } from 'lucide-react'
import { ETIQUETAS_ESTADO_CHEQUE, type EstadoCheque } from './types'

const ESTILOS: Record<EstadoCheque, { texto: string; fondo: string; icono: typeof Circle }> = {
  en_cartera: { texto: 'text-slate-600', fondo: 'bg-slate-100', icono: Wallet },
  disponible: { texto: 'text-sky-700', fondo: 'bg-sky-50', icono: Circle },
  entregado: { texto: 'text-indigo-600', fondo: 'bg-indigo-50', icono: HandCoins },
  depositado: { texto: 'text-advertencia', fondo: 'bg-advertencia/10', icono: Clock },
  acreditado: { texto: 'text-exito', fondo: 'bg-exito/10', icono: CheckCircle2 },
  rechazado: { texto: 'text-error', fondo: 'bg-error/10', icono: XCircle },
  anulado: { texto: 'text-muted-foreground', fondo: 'bg-muted', icono: Ban }
}

/** Insignia de estado de un cheque — 6 estados con color propio (mismo criterio que EstadoVencimientoBadge de Contador: el color es la información principal de un vistazo). */
export function EstadoChequeBadge({ estado, className = '' }: { estado: EstadoCheque; className?: string }) {
  const estilo = ESTILOS[estado]
  const Icono = estilo.icono
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${estilo.fondo} ${estilo.texto} ${className}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {ETIQUETAS_ESTADO_CHEQUE[estado]}
    </span>
  )
}
