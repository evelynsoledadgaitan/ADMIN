import { Loader2 } from 'lucide-react'
import { cn } from '@/core/lib/utils'

/**
 * Indicador de carga único de ADMIN, para esperas cortas: guardando un
 * formulario, cargando una pantalla al entrar. Para listas que tardan en
 * traer datos, preferir <Skeleton/> — se siente más rápido aunque tarde
 * lo mismo, porque muestra la forma del contenido que está por aparecer.
 */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-muted-foreground', className)} aria-label="Cargando" />
}

/** Pantalla completa cargando — para el momento entre login y que llegue el usuario/permisos. */
export function SpinnerPantallaCompleta() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  )
}
