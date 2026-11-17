import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/*
 * Thème clair / sombre de l'application.
 * - Le thème est porté par l'attribut data-theme sur <html> (variables CSS de docs/DESIGN.md).
 * - Le choix est mémorisé dans localStorage (clé « nbm-theme »).
 * - Sans choix mémorisé, on suit la préférence du système.
 * Un petit script dans index.html applique le thème avant le premier affichage (pas de flash).
 */
const CLE_THEME = 'nbm-theme'
const ThemeContext = createContext(null)

function themeInitial() {
  try {
    const memorise = localStorage.getItem(CLE_THEME)
    if (memorise === 'light' || memorise === 'dark') return memorise
  } catch {
    // localStorage indisponible (navigation privée) : on suit le système
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(themeInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const changerTheme = useCallback((nouveau) => {
    setTheme(nouveau)
    try {
      localStorage.setItem(CLE_THEME, nouveau)
    } catch {
      // choix non mémorisé, mais appliqué pour la session
    }
  }, [])

  const basculer = useCallback(
    () => changerTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, changerTheme],
  )

  const valeur = useMemo(() => ({ theme, changerTheme, basculer }), [theme, changerTheme, basculer])
  return <ThemeContext.Provider value={valeur}>{children}</ThemeContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useTheme() {
  const contexte = useContext(ThemeContext)
  if (!contexte) throw new Error('useTheme doit être utilisé dans <ThemeProvider>')
  return contexte
}
