import * as React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/core/lib/queryClient'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from '@/core/components/toast/ToastProvider'
import { ConfirmDialogProvider } from '@/core/components/confirm/ConfirmDialogProvider'
import { PageTitleProvider } from '@/core/components/pageTitle/PageTitleProvider'
import { TooltipProvider } from '@/core/components/Tooltip'

/**
 * Composición de todos los providers globales, en un solo lugar y en el
 * orden correcto: Query y Auth primero (datos), el resto (Toast, Confirm,
 * PageTitle, Tooltip) es UI que cualquier pantalla puede usar en cualquier
 * momento.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <PageTitleProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </PageTitleProvider>
          </ConfirmDialogProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
