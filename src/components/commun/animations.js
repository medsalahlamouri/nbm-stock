/*
 * Animations communes (paquet « motion ») : courtes (150 à 300 ms), sobres.
 * <MotionConfig reducedMotion="user"> dans App.jsx les désactive si le système
 * demande de réduire les animations (prefers-reduced-motion).
 */

const TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] }

/** Apparition d'une carte ou d'un bloc : fondu + léger glissement vers le haut */
export const apparition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: TRANSITION,
}

/** Conteneur d'une liste dont les éléments apparaissent en cascade */
export const listeCascade = {
  initial: 'cache',
  animate: 'visible',
  variants: {
    cache: {},
    visible: { transition: { staggerChildren: 0.035, delayChildren: 0.03 } },
  },
}

/** Élément d'une liste en cascade */
export const elementCascade = {
  variants: {
    cache: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  },
}

/** Transition entre pages */
export const transitionPage = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
}
