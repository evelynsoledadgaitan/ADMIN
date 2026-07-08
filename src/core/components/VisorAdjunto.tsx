import * as React from 'react'
import { FileText, Eye, Download } from 'lucide-react'
import { urlFirmadaAdjunto } from '@/core/lib/adjuntos'
import { Skeleton } from './Skeleton'

export interface VisorAdjuntoProps {
  /** Ruta guardada en `comprobante_path` — si es null/undefined, el componente no renderiza nada (ver docs/sistemas/comprobante-adjunto-interfaz.md sección 4). */
  ruta: string | null | undefined
  label?: string
}

/**
 * Visor de solo lectura de un comprobante ya guardado — único componente
 * para esto en toda la app (Estado de Cuenta, Fichas, diálogos de
 * detalle). El bucket es privado, así que cada apertura pide una URL
 * firmada nueva (5 minutos de validez) en vez de guardar una URL fija.
 */
export function VisorAdjunto({ ruta, label = 'Comprobante' }: VisorAdjuntoProps) {
  const [cargando, setCargando] = React.useState(false)
  const [miniatura, setMiniatura] = React.useState<string | null>(null)

  const esPdf = ruta?.endsWith('.pdf') ?? false
  const nombreArchivo = ruta ? ruta.split('/').pop()! : ''

  React.useEffect(() => {
    if (!ruta || esPdf) {
      setMiniatura(null)
      return
    }
    let cancelado = false
    urlFirmadaAdjunto(ruta).then((url) => {
      if (!cancelado) setMiniatura(url)
    })
    return () => {
      cancelado = true
    }
  }, [ruta, esPdf])

  if (!ruta) return null

  async function handleVer() {
    const url = await urlFirmadaAdjunto(ruta!)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleDescargar() {
    setCargando(true)
    try {
      const url = await urlFirmadaAdjunto(ruta!)
      const respuesta = await fetch(url)
      const blob = await respuesta.blob()
      const urlLocal = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = urlLocal
      enlace.download = nombreArchivo
      enlace.click()
      URL.revokeObjectURL(urlLocal)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="grid gap-1.5 text-sm">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-2.5">
        {esPdf ? (
          <FileText className="h-10 w-10 shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : miniatura ? (
          <img src={miniatura} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
        ) : (
          <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{nombreArchivo}</p>
          <div className="mt-1 flex gap-3 text-xs font-medium">
            <button type="button" onClick={handleVer} className="flex items-center gap-1 text-primary">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Ver
            </button>
            <button type="button" onClick={handleDescargar} disabled={cargando} className="flex items-center gap-1 text-primary">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {cargando ? 'Descargando...' : 'Descargar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
