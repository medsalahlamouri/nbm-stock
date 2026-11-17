import { ThemeProvider, useTheme } from '@/components/layout/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'

/*
 * Écran provisoire de la phase 2 : vérifie que Tailwind, le thème, les polices
 * et shadcn/ui fonctionnent. Il sera remplacé au lot 0 par le routeur et l'AppShell.
 */
function VerificationSocle() {
  const { theme, basculer } = useTheme()
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-8">
      <h1 className="font-serif text-[30px] font-semibold tracking-[-0.02em]">NBM Stock</h1>
      <p className="text-muted-foreground">
        Projet Vite + React prêt. Thème actuel : {theme === 'dark' ? 'sombre' : 'clair'}.
      </p>
      <div className="flex gap-2">
        <Button onClick={basculer}>Changer de thème</Button>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <VerificationSocle />
      <Toaster />
    </ThemeProvider>
  )
}
