/*
 * Fenêtre du mot de passe provisoire (création d'un compte, réinitialisation) :
 * affiché une seule fois, avec un bouton « Copier » et la consigne de le remettre au chef magasin.
 */
import { useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Encart } from '@/components/commun/Encart'

export function MotDePasseProvisoire({
  ouvert,
  onFermer,
  motDePasse,
  personne,
  titre = 'Mot de passe provisoire',
}) {
  const [copie, setCopie] = useState(false)
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(motDePasse)
      setCopie(true)
      toast.success('Mot de passe copié.')
    } catch {
      toast.error('Copie impossible : sélectionnez le mot de passe et copiez-le manuellement.')
    }
  }
  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        if (!o) {
          setCopie(false)
          onFermer()
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="text-gold2 size-5" aria-hidden="true" /> {titre}
          </DialogTitle>
          <DialogDescription>
            À remettre en main propre à {personne}. Il ne sera plus affiché après la fermeture de
            cette fenêtre.
          </DialogDescription>
        </DialogHeader>
        <div className="border-line2 bg-surf2 flex items-center gap-2 rounded-xl border p-2 pl-4">
          <code className="text-ink flex-1 font-mono text-[20px] font-semibold tracking-wider break-all select-all">
            {motDePasse}
          </code>
          <Button variant={copie ? 'outline' : 'default'} onClick={copier}>
            {copie ? <Check /> : <Copy />} {copie ? 'Copié' : 'Copier'}
          </Button>
        </div>
        <Encart ton="info">
          À sa prochaine connexion, la personne devra choisir son propre mot de passe.
        </Encart>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setCopie(false)
              onFermer()
            }}
          >
            J'ai remis le mot de passe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
