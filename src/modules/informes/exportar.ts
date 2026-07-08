import * as XLSX from 'xlsx'

/**
 * Exportar a Excel — reutiliza `xlsx` (SheetJS), ya instalada desde el
 * Bloque 2 para importar listas de precios. No hacía falta ninguna
 * librería nueva: la misma que lee también escribe.
 */
export function exportarExcel(filas: Record<string, string | number>[], nombreHoja: string, nombreArchivo: string) {
  const hoja = XLSX.utils.json_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja.slice(0, 31)) // Excel no admite nombres de hoja de más de 31 caracteres
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}

/**
 * Exportar a PDF — mismo criterio que Facturación (decisión 0029): sin
 * ninguna librería de PDF, se abre una ventana nueva con una tabla
 * simple y se dispara el diálogo de impresión nativo del navegador, que
 * ya ofrece "Guardar como PDF". Una ventana aparte (en vez de imprimir
 * la pantalla actual) evita tener que ocultar con CSS todo lo que no es
 * este informe puntual — más simple y más prolijo.
 */
export function exportarPDF(titulo: string, columnas: string[], filas: (string | number)[][], subtitulo?: string) {
  const ventana = window.open('', '_blank')
  if (!ventana) return

  const filasHtml = filas
    .map((fila) => `<tr>${fila.map((celda) => `<td>${celda}</td>`).join('')}</tr>`)
    .join('')

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; color: #1a1a1a; }
          h1 { font-size: 18px; margin: 0 0 4px; }
          p.subtitulo { color: #666; font-size: 13px; margin: 0 0 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e0e0e0; }
          th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: #666; }
        </style>
      </head>
      <body>
        <h1>${titulo}</h1>
        ${subtitulo ? `<p class="subtitulo">${subtitulo}</p>` : ''}
        <table>
          <thead><tr>${columnas.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${filasHtml}</tbody>
        </table>
      </body>
    </html>
  `)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => ventana.print(), 250) // esperar a que termine de pintar antes de imprimir
}
