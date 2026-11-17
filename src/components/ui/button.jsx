// Composant shadcn/ui « button » (licence MIT), adapté aux gabarits de la maquette (docs/DESIGN.md §4) :
// principal noir 40 px, secondaire blanc bordé, petit bouton 32 px, bouton-icône 38 px, retour visuel au clic.
import * as React from 'react'
import { cva } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 border font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 outline-none select-none active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-red [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'border-strong bg-strong text-bg hover:opacity-90',
        outline: 'border-line2 bg-surf text-ink hover:border-ink3 hover:bg-surf2',
        secondary: 'border-line2 bg-surf text-ink hover:border-ink3 hover:bg-surf2',
        ghost: 'border-transparent bg-transparent text-ink hover:bg-surf2',
        destructive: 'border-red bg-red text-white hover:opacity-90',
        danger: 'border-dline2 bg-surf text-dfg hover:border-dfg hover:bg-dbg',
        link: 'h-auto border-transparent p-0 text-ink underline underline-offset-4 hover:opacity-75',
      },
      size: {
        default: 'h-10 rounded-[10px] px-4 text-[14px]',
        sm: 'h-8 gap-1.5 rounded-lg px-2.5 text-[13px]',
        lg: 'h-[46px] rounded-[10px] px-5 text-[15px]',
        xs: "h-7 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        icon: 'size-[38px] rounded-[10px] border-line bg-surf text-ink hover:bg-surf2',
        'icon-sm': 'size-8 rounded-lg',
        'icon-xs': "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({ className, variant = 'default', size = 'default', asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
