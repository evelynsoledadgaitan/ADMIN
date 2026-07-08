import * as React from 'react'

interface PageTitleContextValue {
  titulo: string | null
  setTitulo: (titulo: string | null) => void
}

const PageTitleContext = React.createContext<PageTitleContextValue | undefined>(undefined)

/**
 * Permite que una pantalla anuncie su propio título ("Nuevo cliente",
 * "Editar cliente", o el nombre real de un cliente en su Ficha) para que
 * la TopBar lo muestre en vez del nombre genérico del módulo. Ver
 * `usePageTitle` (core/hooks/usePageTitle.ts) y
 * docs/decisiones/0012-titulo-dinamico-y-rendimiento.md.
 */
export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [titulo, setTitulo] = React.useState<string | null>(null)
  return (
    <PageTitleContext.Provider value={{ titulo, setTitulo }}>{children}</PageTitleContext.Provider>
  )
}

export function usePageTitleContext() {
  const ctx = React.useContext(PageTitleContext)
  if (!ctx) throw new Error('usePageTitle debe usarse dentro de <PageTitleProvider>')
  return ctx
}
