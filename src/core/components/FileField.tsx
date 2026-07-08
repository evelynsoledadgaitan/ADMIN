import * as React from 'react'
import { ImagePlus, File as FileIcon, X } from 'lucide-react'
import { cn } from '@/core/lib/utils'

export interface FileFieldProps {
  label: string
  value: File | null
  onChange: (archivo: File | null) => void
  accept?: string
  error?: string
}

/**
 * Selector de archivo único de ADMIN. Pensado originalmente para la
 * fotografía de un cheque (por eso el ícono y el preview por defecto son
 * de imagen), pero desde el Sprint 5 también se usa para elegir un CSV a
 * importar — en ese caso no hay preview visual posible, así que se
 * muestra un "chip" con el nombre del archivo en su lugar. El criterio de
 * cuál mostrar es automático: se decide mirando el `type` del archivo
 * elegido, no una prop nueva — así este componente sirve para cualquier
 * adjunto futuro (comprobantes de Compras/Movimientos) sin cambios.
 */
export function FileField({ label, value, onChange, accept = 'image/*', error }: FileFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const esImagen = value?.type.startsWith('image/') ?? false

  React.useEffect(() => {
    if (!value || !esImagen) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value, esImagen])

  return (
    <div className="grid gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {value && esImagen && previewUrl ? (
        <div className="relative w-fit">
          <img src={previewUrl} alt={label} className="h-32 w-32 rounded-md border border-border object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Quitar archivo"
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-archivar text-archivar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : value && !esImagen ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm text-foreground">{value.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Quitar archivo" className="shrink-0 rounded-full p-1 active:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground',
            'tocable',
            error && 'border-error text-error'
          )}
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-xs">Agregar archivo</span>
        </button>
      )}
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  )
}
