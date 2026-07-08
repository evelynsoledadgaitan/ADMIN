import * as React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

/**
 * Tooltip único de ADMIN — pensado para escritorio (acciones por fila de
 * `DataTable`, íconos sin texto visible). En celular no aporta nada (no
 * hay "hover" con el dedo) así que Radix ya lo omite solo en touch — no
 * hace falta ninguna lógica extra acá.
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={400}>{children}</RadixTooltip.Provider>
}

export function Tooltip({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side="top"
          sideOffset={6}
          className="z-50 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg animar-entrada-pantalla"
        >
          {texto}
          <RadixTooltip.Arrow className="fill-foreground" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
