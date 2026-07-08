import * as React from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { cn, LABEL_CAMPO } from '@/core/lib/utils'
import { Button } from './Button'

export interface OpcionSelect {
  value: string
  label: string
}

const VALOR_CREAR = '__crear_opcion__'

export interface SelectProps {
  label: string
  placeholder?: string
  value?: string
  onValueChange: (value: string) => void
  opciones: OpcionSelect[]
  disabled?: boolean
  className?: string
  /**
   * Si se pasa, agrega una opción "+ {textoCrearOpcion}" al final de la
   * lista. Al elegirla, el Select se reemplaza momentáneamente por un
   * campo de texto para crear la opción sin salir del formulario (ej.
   * categorías de producto — "las categorías se crean manualmente").
   * Debe devolver el id de la opción recién creada.
   */
  onCrearOpcion?: (texto: string) => Promise<string>
  textoCrearOpcion?: string
}

/**
 * Selector único de ADMIN, para cualquier campo que se elige de una lista
 * cerrada: condición frente al IVA, categoría de producto, estado de
 * cheque, modalidad de pago, etc. Envuelve Radix Select para tener
 * accesibilidad y comportamiento de teclado correctos "gratis", con el
 * mismo aspecto visual que el resto de los campos de formulario.
 */
export function Select({
  label,
  placeholder = 'Seleccionar...',
  value,
  onValueChange,
  opciones,
  disabled,
  className,
  onCrearOpcion,
  textoCrearOpcion = 'Nueva opción'
}: SelectProps) {
  const [creando, setCreando] = React.useState(false)
  const [textoNuevo, setTextoNuevo] = React.useState('')
  const [guardandoNuevo, setGuardandoNuevo] = React.useState(false)

  function handleValueChange(v: string) {
    if (v === VALOR_CREAR) {
      setCreando(true)
      return
    }
    onValueChange(v)
  }

  async function handleGuardarNuevo() {
    if (!onCrearOpcion || !textoNuevo.trim()) return
    setGuardandoNuevo(true)
    try {
      const nuevoId = await onCrearOpcion(textoNuevo.trim())
      onValueChange(nuevoId)
      setCreando(false)
      setTextoNuevo('')
    } finally {
      setGuardandoNuevo(false)
    }
  }

  if (creando) {
    return (
      <div className="grid gap-1.5 text-sm">
        <span className={LABEL_CAMPO}>{textoCrearOpcion}</span>
        <div className="flex gap-2">
          <input
            autoFocus
            value={textoNuevo}
            onChange={(e) => setTextoNuevo(e.target.value)}
            disabled={guardandoNuevo}
            className="h-11 flex-1 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Button
            accion="cancelar"
            type="button"
            onClick={() => {
              setCreando(false)
              setTextoNuevo('')
            }}
            disabled={guardandoNuevo}
          >
            Cancelar
          </Button>
          <Button accion="guardar" type="button" onClick={handleGuardarNuevo} disabled={guardandoNuevo || !textoNuevo.trim()}>
            {guardandoNuevo ? 'Creando...' : 'Crear'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <label className={cn('grid gap-1.5 text-sm', className)}>
      {label && <span className={LABEL_CAMPO}>{label}</span>}
      <RadixSelect.Root value={value} onValueChange={handleValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          className={cn(
            'flex h-11 items-center justify-between rounded-md border border-border bg-surface px-3 text-sm transition-colors',
            'hover:border-border-strong',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary',
            'disabled:opacity-50 data-[placeholder]:text-muted-foreground'
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="z-50 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
          >
            <RadixSelect.Viewport className="p-1">
              {opciones.map((opcion) => (
                <RadixSelect.Item
                  key={opcion.value}
                  value={opcion.value}
                  className={cn(
                    'relative flex h-11 cursor-pointer select-none items-center rounded-sm px-8 text-sm',
                    'data-[highlighted]:bg-muted data-[highlighted]:outline-none'
                  )}
                >
                  <RadixSelect.ItemText>{opcion.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute left-2 flex items-center">
                    <Check className="h-4 w-4" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
              {onCrearOpcion && (
                <RadixSelect.Item
                  value={VALOR_CREAR}
                  className={cn(
                    'relative flex h-11 cursor-pointer select-none items-center gap-2 rounded-sm px-3 text-sm font-medium text-primary',
                    'data-[highlighted]:bg-muted data-[highlighted]:outline-none'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <RadixSelect.ItemText>{textoCrearOpcion}</RadixSelect.ItemText>
                </RadixSelect.Item>
              )}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </label>
  )
}
