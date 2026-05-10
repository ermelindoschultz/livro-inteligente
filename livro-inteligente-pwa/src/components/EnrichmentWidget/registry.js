import { Teach } from 'pixelarticons/react/Teach'
import Trivia from './widgets/Trivia.jsx'

export const enrichmentRegistry = {
  trivia: {
    component: Trivia,
    icon: Teach,
    label: 'Treinamento',
  },
}

export function getEnrichmentDefinition(type) {
  return enrichmentRegistry[type] ?? null
}