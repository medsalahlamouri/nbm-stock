/*
 * Écran provisoire, affiché le temps de construire l'écran définitif (supprimé à la fin du lot 8).
 */
import { Hammer } from 'lucide-react'
import { Page, PageEntete } from '@/components/commun/PageEntete'
import { Carte } from '@/components/commun/Carte'
import { EtatVide } from '@/components/commun/Etats'

export function EcranAVenir({ titre, fiche }) {
  return (
    <Page>
      <PageEntete titre={titre} description={`Écran ${fiche} de docs/ECRANS.md.`} />
      <Carte>
        <EtatVide icone={Hammer} titre="Écran en construction" message="Cet écran sera disponible dans un prochain lot." />
      </Carte>
    </Page>
  )
}
