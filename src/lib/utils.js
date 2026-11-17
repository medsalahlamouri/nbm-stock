import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Fusionne des classes Tailwind en résolvant les conflits (utilitaire standard de shadcn/ui, licence MIT).
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
