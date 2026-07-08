import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { moduloPorKey } from '@/core/theme/modulos'
import type { Modulo } from '@/core/hooks/usePermissions'

/** Encabezado compartido por las 5 categorías de Informes — volver + título con el mismo ícono/color del módulo consultado. */
export function PaginaCategoriaInformes({ modulo, children }: { modulo: Modulo; children: React.ReactNode }) {
  const navigate = useNavigate()
  const info = moduloPorKey(modulo)!
  const Icono = info.icono

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-6">
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => navigate('/informes')} aria-label="Volver a Informes" className="rounded-full p-1 active:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${info.fondo}`}>
          <Icono className={`h-4 w-4 ${info.color}`} aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Informes de {info.nombre}</h1>
      </div>
      {children}
    </div>
  )
}
