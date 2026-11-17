// Composant shadcn/ui « sonner » (licence MIT), adapté : thème lu depuis notre ThemeProvider
// au lieu de next-themes, toasts en bas à droite, couleurs de la maquette (succès vert, erreur rouge brique).
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner } from 'sonner'
import { useTheme } from '@/components/layout/ThemeProvider'

const Toaster = ({ ...props }) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        '--normal-bg': 'var(--surf)',
        '--normal-text': 'var(--ink)',
        '--normal-border': 'var(--line)',
        '--success-bg': 'var(--okbg)',
        '--success-text': 'var(--okfg)',
        '--success-border': 'var(--okbg)',
        '--error-bg': 'var(--dbg)',
        '--error-text': 'var(--dfg)',
        '--error-border': 'var(--dline)',
        '--warning-bg': 'var(--wbg)',
        '--warning-text': 'var(--wfg)',
        '--warning-border': 'var(--wbg)',
        '--info-bg': 'var(--ibg)',
        '--info-text': 'var(--ifg)',
        '--info-border': 'var(--ibg)',
        '--border-radius': '12px',
      }}
      {...props}
    />
  )
}

export { Toaster }
