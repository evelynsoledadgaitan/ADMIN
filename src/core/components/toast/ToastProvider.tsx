import * as React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'

export type TipoToast = 'exito' | 'advertencia' | 'error' | 'info'

interface ToastItem {
  id: string
  tipo: TipoToast
  mensaje: string
}

interface ToastContextValue {
  mostrar: (tipo: TipoToast, mensaje: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

const ICONOS: Record<TipoToast, React.ComponentType<{ className?: string }>> = {
  exito: CheckCircle2,
  advertencia: AlertTriangle,
  error: XCircle,
  info: Info
}

// Clases explícitas (no interpoladas) para que Tailwind las detecte en el build.
const ESTILOS: Record<TipoToast, string> = {
  exito: 'bg-exito text-exito-foreground',
  advertencia: 'bg-advertencia text-advertencia-foreground',
  error: 'bg-error text-error-foreground',
  info: 'bg-info text-info-foreground'
}

const DURACION_MS = 4000

/**
 * Snackbar / Toast único de ADMIN. Cualquier confirmación de una acción
 * ("Guardado", "No se pudo archivar", "Revisá el CUIT") pasa por acá — no
 * por un alert(), no por un mensaje inline distinto en cada formulario.
 * Usar el hook `useToast()` (core/hooks/useToast.ts) para dispararlo.
 *
 * Posición: arriba de la BottomNav (misma lógica de offset que el FAB),
 * para no taparse con la navegación ni con el pulgar del usuario.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const mostrar = React.useCallback((tipo: TipoToast, mensaje: string) => {
    const id = crypto.randomUUID()
    setToasts((actuales) => [...actuales, { id, tipo, mensaje }])
    setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id))
    }, DURACION_MS)
  }, [])

  function cerrar(id: string) {
    setToasts((actuales) => actuales.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div
        className="fixed inset-x-4 z-50 flex flex-col gap-2 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 md:inset-x-auto md:right-6 md:w-96"
      >
        {toasts.map((toast) => {
          const Icono = ICONOS[toast.tipo]
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg animar-entrada-pantalla',
                ESTILOS[toast.tipo]
              )}
            >
              <Icono className="h-5 w-5 shrink-0" />
              <span className="flex-1">{toast.mensaje}</span>
              <button onClick={() => cerrar(toast.id)} aria-label="Cerrar" className="shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
