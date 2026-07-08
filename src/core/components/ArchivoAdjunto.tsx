import * as React from 'react'
import { Paperclip, FileText, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'
import { useConfirm } from '@/core/hooks/useConfirm'
import { esImagen, formatearTamano, generarMiniaturaCorregida, validarArchivoAdjunto } from '@/core/lib/adjuntos'

export interface ArchivoAdjuntoProps {
  value: File | null
  onChange: (archivo: File | null) => void
  label?: string
  error?: string
  disabled?: boolean
}

/**
 * Selector de comprobante adjunto — único componente de carga de archivos
 * de todo ADMIN (ver docs/sistemas/comprobante-adjunto-interfaz.md). No
 * sabe qué es una "deuda" ni un "movimiento": recibe y devuelve un
 * `File | null`, quien lo usa decide cuándo subirlo (ver
 * core/lib/adjuntos.ts). Siempre opcional — nunca marca error por estar
 * vacío.
 *
 * Reemplazar/quitar solo existen ANTES de guardar el formulario: los
 * registros a los que se adjunta (Deuda, Ingreso, Movimiento) son
 * inmutables una vez guardados, mismo criterio que el resto de la app —
 * este componente no tiene ningún modo de "editar un adjunto ya subido".
 */
export function ArchivoAdjunto({ value, onChange, label = 'Adjuntar comprobante', error, disabled }: ArchivoAdjuntoProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const confirmar = useConfirm()
  const [miniatura, setMiniatura] = React.useState<string | null>(null)
  const [errorLocal, setErrorLocal] = React.useState<string | null>(null)

  const imagen = value ? esImagen(value.type) : false

  React.useEffect(() => {
    if (!value || !imagen) {
      setMiniatura(null)
      return
    }
    let cancelado = false
    generarMiniaturaCorregida(value).then((url) => {
      if (!cancelado) setMiniatura(url)
    })
    return () => {
      cancelado = true
    }
  }, [value, imagen])

  function handleSeleccion(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo si se quita y se vuelve a agregar
    if (!archivo) return

    const mensaje = validarArchivoAdjunto(archivo)
    if (mensaje) {
      setErrorLocal(mensaje)
      return
    }
    setErrorLocal(null)
    onChange(archivo)
  }

  async function handleQuitar() {
    const confirmado = await confirmar({
      titulo: 'Quitar comprobante',
      mensaje: 'Se va a quitar el archivo que elegiste. Podés volver a adjuntarlo si fue sin querer.',
      textoConfirmar: 'Quitar',
      accionConfirmar: 'archivar'
    })
    if (!confirmado) return
    onChange(null)
  }

  const mensajeError = error ?? errorLocal

  return (
    <div className="grid gap-1.5 text-sm">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleSeleccion}
        disabled={disabled}
      />

      {!value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2.5 rounded-md border border-dashed border-border px-3 py-2.5 text-left text-muted-foreground',
            'tocable hover:border-border-strong',
            mensajeError && 'border-error text-error'
          )}
        >
          <Paperclip className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span>
            <span className="block text-sm font-medium text-foreground">{label}</span>
            <span className="block text-xs">PDF, JPG o PNG · Máx. 5 MB</span>
          </span>
        </button>
      )}

      {value && imagen && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-2.5">
          {miniatura ? (
            <img src={miniatura} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
            <p className="text-xs text-muted-foreground">{formatearTamano(value.size)}</p>
            <div className="mt-1 flex gap-3 text-xs font-medium">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="text-primary">
                Cambiar
              </button>
              <button type="button" onClick={handleQuitar} disabled={disabled} className="text-error">
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {value && !imagen && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-2.5">
          <FileText className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.name}</p>
            <p className="text-xs text-muted-foreground">{formatearTamano(value.size)}</p>
            <div className="mt-1 flex gap-3 text-xs font-medium">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="text-primary">
                Cambiar
              </button>
              <button type="button" onClick={handleQuitar} disabled={disabled} className="text-error">
                Quitar
              </button>
            </div>
          </div>
          <button type="button" onClick={handleQuitar} aria-label="Quitar archivo" disabled={disabled} className="shrink-0 rounded-full p-1 active:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {mensajeError && <span className="text-xs text-error">{mensajeError}</span>}
    </div>
  )
}
