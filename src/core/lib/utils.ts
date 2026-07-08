import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza texto para comparar ignorando mayúsculas/minúsculas y acentos
 * ("José" y "jose" deben matchear). Uso central en ListView — cualquier
 * buscador de la app hereda este comportamiento sin tener que repetirlo.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Estilo único de label de campo — identidad visual definitiva, Etapa 2.
 * Reemplaza el "font-medium" simple por el tratamiento editorial (chico,
 * mayúscula, tracking abierto) usado en toda la app para encabezados de
 * sección y labels de formulario — ver identidad-visual-admin.md sección 3.
 */
export const LABEL_CAMPO = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'
