import { Lock } from 'lucide-react'
import { usePermissions, type Modulo } from '@/core/hooks/usePermissions'
import { cardClassName } from '@/core/components/Card'

/**
 * Envuelve cada sección/categoría de Informes — exige el permiso
 * `informes` Y el permiso del módulo que consulta (decisión aprobada,
 * punto 2): ver el informe de Empleados exige `informes` + `empleados`,
 * no alcanza con uno solo. Si falta cualquiera de los dos, se muestra un
 * aviso en vez del contenido — nunca datos parciales silenciosos.
 */
export function SeccionInforme({ modulo, children }: { modulo: Modulo; children: React.ReactNode }) {
  const { puede } = usePermissions()

  if (!puede('informes', 'ver') || !puede(modulo, 'ver')) {
    return (
      <div className={cardClassName() + ' flex items-center gap-2.5 p-4 text-sm text-muted-foreground'}>
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        No tenés permiso para ver esta información.
      </div>
    )
  }

  return <>{children}</>
}
