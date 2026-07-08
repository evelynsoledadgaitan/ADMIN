import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Archive, Pencil } from 'lucide-react'
import { Button, type ButtonProps } from '@/core/components/Button'

export interface OpcionesConfirmacion {
  titulo: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
  /** Color del botón de confirmar. 'archivar' para acciones destructivas/irreversibles-dentro-de-lo-posible. */
  accionConfirmar?: Extract<ButtonProps['accion'], 'guardar' | 'archivar' | 'modificar'>
}

interface EstadoDialogo extends OpcionesConfirmacion {
  resolver: (resultado: boolean) => void
}

interface ConfirmContextValue {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>
}

const ConfirmContext = React.createContext<ConfirmContextValue | undefined>(undefined)

const ICONOS_CONFIRMACION = { guardar: Check, modificar: Pencil, archivar: Archive } as const

/**
 * Diálogo de confirmación único de ADMIN — para "¿Archivar este cliente?",
 * "¿Cancelar sin guardar?", etc. Se usa de forma imperativa con el hook
 * `useConfirm()` (core/hooks/useConfirm.ts), que devuelve una Promise, para
 * poder escribir flujos simples tipo:
 *
 *   const confirmar = useConfirm()
 *   if (await confirmar({ titulo: 'Archivar cliente', mensaje: '...' })) { ... }
 *
 * en vez de armar estado de "diálogo abierto" a mano en cada pantalla.
 */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogo, setDialogo] = React.useState<EstadoDialogo | null>(null)

  const confirmar = React.useCallback((opciones: OpcionesConfirmacion) => {
    return new Promise<boolean>((resolver) => {
      setDialogo({ ...opciones, resolver })
    })
  }, [])

  function cerrar(resultado: boolean) {
    dialogo?.resolver(resultado)
    setDialogo(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}
      <Dialog.Root open={dialogo !== null} onOpenChange={(abierto) => !abierto && cerrar(false)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animar-entrada-pantalla" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-5 shadow-xl animar-entrada-pantalla">
            {dialogo && (
              <>
                <Dialog.Title className="text-base font-semibold text-foreground">
                  {dialogo.titulo}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  {dialogo.mensaje}
                </Dialog.Description>
                <div className="mt-5 flex gap-2">
                  <Button accion="cancelar" className="flex-1" onClick={() => cerrar(false)}>
                    {dialogo.textoCancelar ?? 'Cancelar'}
                  </Button>
                  <Button
                    accion={dialogo.accionConfirmar ?? 'guardar'}
                    icono={ICONOS_CONFIRMACION[dialogo.accionConfirmar ?? 'guardar']}
                    className="flex-1"
                    onClick={() => cerrar(true)}
                  >
                    {dialogo.textoConfirmar ?? 'Confirmar'}
                  </Button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </ConfirmContext.Provider>
  )
}

export function useConfirmContext() {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmDialogProvider>')
  return ctx
}
