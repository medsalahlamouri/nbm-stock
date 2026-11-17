/*
 * Racine de l'application : assemble les fournisseurs de contexte.
 * - ThemeProvider : thème clair / sombre (mémorisé)
 * - QueryClientProvider : cache des données (TanStack Query)
 * - AuthProvider : session Supabase et profil de l'utilisateur connecté
 * - TooltipProvider : infobulles shadcn/ui
 * - MotionConfig : animations désactivées si le système demande de les réduire
 * - RouterProvider : routes et gardes (src/routes.jsx)
 * - Toaster : notifications en bas à droite (sonner)
 */
import { Suspense } from 'react'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { queryClient } from '@/lib/requetes'
import { router } from '@/routes'
import { EcranDemarrage } from '@/components/layout/Chargement'

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider delayDuration={300}>
            <MotionConfig reducedMotion="user">
              <Suspense fallback={<EcranDemarrage />}>
                <RouterProvider router={router} />
              </Suspense>
              <Toaster />
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
