import { BookOpen, BrainCircuit, ClipboardList } from 'lucide-react'
import ResumeToTest from './widgets/ResumeToTest.jsx'
import Trivia from './widgets/Trivia.jsx'
import WhatYouWillLearn from './widgets/WhatYouWillLearn.jsx'

export const enrichmentRegistry = {
  what_you_will_learn: {
    component: WhatYouWillLearn,
    icon: BookOpen,
    label: 'O que voce vai aprender',
  },
  trivia: {
    component: Trivia,
    icon: BrainCircuit,
    label: 'Trivia',
  },
  resume_to_test: {
    component: ResumeToTest,
    icon: ClipboardList,
    label: 'Resumo para revisar',
  },
}

export function getEnrichmentDefinition(type) {
  return enrichmentRegistry[type] ?? null
}