import { useEffect, useRef, useState } from 'react'

/**
 * Persiste el texto de búsqueda y la posición de scroll de un listado
 * mientras dura la sesión, para cumplir la regla "conservan posición al
 * volver". Se identifica cada lista por una key única (ej: "clientes").
 *
 * Nota: usa sessionStorage porque es una app real corriendo en el navegador
 * del usuario (no un artifact de Claude) — se borra al cerrar la pestaña,
 * que es el comportamiento esperado para "posición al volver" dentro de la
 * misma sesión de trabajo.
 */
export function useListState(key: string) {
  const storageKey = `admin:list:${key}`
  const [busqueda, setBusquedaState] = useState(() => {
    if (typeof window === 'undefined') return ''
    return sessionStorage.getItem(`${storageKey}:busqueda`) ?? ''
  })
  const scrollRef = useRef<HTMLDivElement | null>(null)

  function setBusqueda(valor: string) {
    setBusquedaState(valor)
    sessionStorage.setItem(`${storageKey}:busqueda`, valor)
  }

  // Restaurar posición de scroll al montar
  useEffect(() => {
    const saved = sessionStorage.getItem(`${storageKey}:scroll`)
    if (saved && scrollRef.current) {
      scrollRef.current.scrollTop = Number(saved)
    }
  }, [storageKey])

  function guardarScroll() {
    if (scrollRef.current) {
      sessionStorage.setItem(`${storageKey}:scroll`, String(scrollRef.current.scrollTop))
    }
  }

  return { busqueda, setBusqueda, scrollRef, guardarScroll }
}
