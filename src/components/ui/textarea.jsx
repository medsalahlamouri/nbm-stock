// Composant shadcn/ui « textarea » (licence MIT), adapté à la maquette (mêmes bordures que les champs).
import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-[10px] border border-line2 bg-surf px-3 py-2.5 text-[14px] text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted2',
        'focus-visible:border-ink focus-visible:ring-1 focus-visible:ring-ink focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:bg-surf2 aria-invalid:border-red aria-invalid:ring-1 aria-invalid:ring-red',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
