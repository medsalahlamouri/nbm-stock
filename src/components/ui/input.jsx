// Composant shadcn/ui « input » (licence MIT), adapté à la maquette :
// hauteur 44 px, rayon 10 px, bordure --line2, fond --surf, focus contour 2 px encre.
import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-line2 bg-surf text-ink placeholder:text-muted2 h-11 w-full min-w-0 rounded-[10px] border px-3 text-[14px] transition-[border-color,box-shadow] duration-150 outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:border-ink focus-visible:ring-ink focus-visible:ring-1 focus-visible:outline-none',
        'disabled:bg-surf2 disabled:text-muted read-only:bg-surf2 disabled:cursor-not-allowed',
        'aria-invalid:border-red aria-invalid:ring-red aria-invalid:ring-1',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
