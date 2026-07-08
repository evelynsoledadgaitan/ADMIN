import { CheckCircle2, AlertCircle, Clock, Circle } from 'lucide-react'
import { ETIQUETAS_ESTADO_VENCIMIENTO, type EstadoVencimiento } from './types'

const ESTILOS: Record<EstadoVencimiento, { texto: string; fondo: string; icono: typeof CheckCircle2 }> = {
  pagada: { texto: 'text-exito', fondo: 'bg-exito/10', icono: CheckCircle2 },
  vencida: { texto: 'text-error', fondo: 'bg-error/10', icono: AlertCircle },
  proxima_a_vencer: { texto: 'text-advertencia', fondo: 'bg-advertencia/10', icono: Clock },
  pendiente: { texto: 'text-muted-foreground', fondo: 'bg-muted', icono: Circle }
}

/**
 * Insignia de estado de un vencimiento — pedido explícito: "priorizar
 * muchísimo los colores de estado". Más grande y con ícono, a propósito
 * más protagonista que otras insignias del sistema (ej. Estado de
 * Facturación) — acá el color ES la información principal de un vistazo.
 */
export function EstadoVencimientoBadge({ estado, className = '' }: { estado: EstadoVencimiento; className?: string }) {
  const estilo = ESTILOS[estado]
  const Icono = estilo.icono
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${estilo.fondo} ${estilo.texto} ${className}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {ETIQUETAS_ESTADO_VENCIMIENTO[estado]}
    </span>
  )
}
