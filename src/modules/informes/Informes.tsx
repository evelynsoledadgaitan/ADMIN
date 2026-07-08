import { useNavigate } from 'react-router-dom'
import { moduloPorKey } from '@/core/theme/modulos'
import { cardClassName } from '@/core/components/Card'
import { usePermissions, type Modulo } from '@/core/hooks/usePermissions'

const CATEGORIAS: { modulo: Modulo; ruta: string; descripcion: string }[] = [
  { modulo: 'clientes', ruta: '/informes/clientes', descripcion: 'Saldos pendientes, a favor y mayor deuda' },
  { modulo: 'proveedores', ruta: '/informes/proveedores', descripcion: 'Pagos realizados y deudas pendientes' },
  { modulo: 'facturacion', ruta: '/informes/facturacion', descripcion: 'Emitidas, pendientes de emitir y total facturado' },
  { modulo: 'empleados', ruta: '/informes/empleados', descripcion: 'Pagos realizados y adelantos' },
  { modulo: 'contador', ruta: '/informes/contador', descripcion: 'Pendientes, vencidas y próximos vencimientos' }
]

/**
 * Informes — landing con las 5 categorías (ver
 * docs/sistemas/informes-diseno.md). Exclusivamente de consulta: ninguna
 * de estas pantallas inserta, modifica ni anula nada en ningún otro
 * módulo. Cada tarjeta exige el permiso `informes` + el del módulo
 * correspondiente (decisión aprobada) — las que faltan simplemente no
 * se muestran acá (no hace falta un aviso en la landing, alcanza con no
 * ofrecer un camino hacia algo sin acceso).
 */
export function Informes() {
  const navigate = useNavigate()
  const { puede } = usePermissions()

  const categoriasVisibles = CATEGORIAS.filter((c) => puede('informes', 'ver') && puede(c.modulo, 'ver'))

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Informes</h1>
      <p className="mb-5 text-sm text-muted-foreground">Consultá rápido lo que ADMIN ya viene registrando.</p>

      {categoriasVisibles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tenés permiso para ver ningún informe.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categoriasVisibles.map((c) => {
            const modulo = moduloPorKey(c.modulo)!
            const Icono = modulo.icono
            return (
              <button
                key={c.modulo}
                onClick={() => navigate(c.ruta)}
                className={cardClassName(true) + ` flex items-start gap-3 border-l-[3px] p-4 text-left ${modulo.borde}`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${modulo.fondo}`}>
                  <Icono className={`h-[18px] w-[18px] ${modulo.color}`} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{modulo.nombre}</span>
                  <span className="block text-xs text-muted-foreground">{c.descripcion}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
