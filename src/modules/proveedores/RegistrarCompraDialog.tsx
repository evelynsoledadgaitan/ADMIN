import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { CurrencyField } from '@/core/components/CurrencyField'
import { DateField } from '@/core/components/DateField'
import { TextField } from '@/core/components/TextField'
import { Select } from '@/core/components/Select'
import { Button } from '@/core/components/Button'
import { ArchivoAdjunto } from '@/core/components/ArchivoAdjunto'
import { useToast } from '@/core/hooks/useToast'
import { hoyISO } from '@/modules/pagos/validaciones'
import { useRegistrarCompra } from './api'
import { validarCompra, hayErrores, type ErroresCompra } from './validaciones'
import { valoresCompraVacio, ETIQUETAS_ORIGEN_COMPRA, type CompraFormValues, type OrigenCompra } from './types'

const VALOR_AJUSTE = '__ajuste__'

const OPCIONES_ORIGEN = [
  ...Object.entries(ETIQUETAS_ORIGEN_COMPRA).map(([value, label]) => ({ value, label })),
  { value: VALOR_AJUSTE, label: 'Ajuste' }
]

export interface RegistrarCompraDialogProps {
  proveedorId: string
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  /** Se dispara además de onOpenChange(false), solo cuando el guardado fue exitoso — para que quien orquesta el flujo (ej. los accesos rápidos de Inicio) pueda reaccionar (navegar al Estado de cuenta). */
  onGuardado?: () => void
  /**
   * El usuario eligió "Ajuste" en el selector de origen — no es un origen
   * real de esta tabla (ver docs/sistemas/reorganizacion-flujo-operativo.md,
   * sección 0.1). Este diálogo se cierra solo; quien lo usa debe abrir
   * RegistrarAjusteDialog en su lugar. Sin este callback (ej. si se usa
   * fuera del Estado de cuenta) la opción "Ajuste" no se muestra.
   */
  onElegirAjuste?: () => void
}

/**
 * Agregar ingreso de mercadería — componente propio de Proveedores (no
 * vive en modules/pagos: no lo va a reusar ningún otro módulo, ver
 * docs/sistemas/modulo-proveedores-arquitectura.md sección 4.4).
 *
 * Nombre técnico interno ("compra") sin cambios a propósito — evita
 * migraciones/renombres de código innecesarios. Todo el texto visible
 * (título, opciones, mensajes) usa la terminología aprobada: "Ingreso de
 * mercadería", nunca "Compra".
 */
export function RegistrarCompraDialog({ proveedorId, abierto, onOpenChange, onGuardado, onElegirAjuste }: RegistrarCompraDialogProps) {
  const toast = useToast()
  const registrar = useRegistrarCompra(proveedorId)

  const [valores, setValores] = React.useState<CompraFormValues>(() => valoresCompraVacio(hoyISO()))
  const [errores, setErrores] = React.useState<ErroresCompra>({})
  const [archivo, setArchivo] = React.useState<File | null>(null)

  React.useEffect(() => {
    if (abierto) {
      setValores(valoresCompraVacio(hoyISO()))
      setErrores({})
      setArchivo(null)
    }
  }, [abierto])

  function actualizar<K extends keyof CompraFormValues>(campo: K, valor: CompraFormValues[K]) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
  }

  function manejarCambioOrigen(v: string) {
    if (v === VALOR_AJUSTE) {
      onOpenChange(false)
      onElegirAjuste?.()
      return
    }
    actualizar('origen', v as OrigenCompra)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erroresValidacion = validarCompra(valores)
    setErrores(erroresValidacion)
    if (hayErrores(erroresValidacion)) return

    registrar.mutate(
      { valores, archivo },
      {
        onSuccess: () => {
          toast.exito('Ingreso registrado')
          onOpenChange(false)
          onGuardado?.()
        },
        onError: () => toast.error('No se pudo registrar el ingreso')
      }
    )
  }

  return (
    <Dialog.Root open={abierto} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-5 shadow-xl animar-entrada-pantalla sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">Agregar ingreso de mercadería</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Cerrar" className="rounded-full p-1 active:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Origen"
              value={valores.origen}
              onValueChange={manejarCambioOrigen}
              opciones={onElegirAjuste ? OPCIONES_ORIGEN : OPCIONES_ORIGEN.filter((o) => o.value !== VALOR_AJUSTE)}
              disabled={registrar.isPending}
            />
            <TextField
              label="Descripción"
              value={valores.descripcion}
              onChange={(e) => actualizar('descripcion', e.target.value)}
              error={errores.descripcion}
              disabled={registrar.isPending}
            />
            <CurrencyField
              label="Importe"
              value={valores.monto}
              onValueChange={(v) => actualizar('monto', v)}
              error={errores.monto}
              disabled={registrar.isPending}
            />
            <DateField
              label="Fecha"
              value={valores.fecha}
              max={hoyISO()}
              onChange={(e) => actualizar('fecha', e.target.value)}
              error={errores.fecha}
              disabled={registrar.isPending}
            />
            <TextField
              label="Número de comprobante (opcional)"
              value={valores.numero_comprobante}
              onChange={(e) => actualizar('numero_comprobante', e.target.value)}
              disabled={registrar.isPending}
            />
            <ArchivoAdjunto value={archivo} onChange={setArchivo} disabled={registrar.isPending} />

            <div className="flex gap-2 pt-2">
              <Dialog.Close asChild>
                <Button accion="cancelar" type="button" className="flex-1" disabled={registrar.isPending}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button accion="guardar" type="submit" className="flex-1" disabled={registrar.isPending}>
                {registrar.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
