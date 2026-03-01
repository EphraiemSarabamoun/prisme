export type Locale = "en" | "fr";

const strings = {
  en: {
    tagline: "See your writing through every lens",
    word: "word",
    words: "words",
    getPerspectives: "Get Perspectives",
    perspectives: "Perspectives",
    placeholder: "Start writing your article here...",
    approval: "Approval",
    disagreements: "Disagreements",
    perspective: "Perspective",
    emptyState:
      'Write something and click "Get Perspectives" to see feedback.',
    feedbackError: "Failed to get feedback:",
    suggestEdits: "Suggest edits",
    reviewingChanges: "Reviewing suggested changes from",
    acceptAll: "Accept all",
    rejectAll: "Reject all",
    agentNames: {
      "conservative-skeptic": "Conservative Skeptic",
      "progressive-advocate": "Progressive Advocate",
      "centrist-factchecker": "Centrist Fact-Checker",
    } as Record<string, string>,
    langSuffix: "",
  },
  fr: {
    tagline: "Voyez votre texte sous tous les angles",
    word: "mot",
    words: "mots",
    getPerspectives: "Obtenir les perspectives",
    perspectives: "Perspectives",
    placeholder: "Commencez a rediger votre article ici...",
    approval: "Approbation",
    disagreements: "Desaccords",
    perspective: "Point de vue",
    emptyState:
      'Ecrivez quelque chose et cliquez sur "Obtenir les perspectives" pour voir les retours.',
    feedbackError: "Echec de l'obtention du retour :",
    suggestEdits: "Suggerer des modifications",
    reviewingChanges: "Modifications suggerees par",
    acceptAll: "Tout accepter",
    rejectAll: "Tout rejeter",
    agentNames: {
      "conservative-skeptic": "Sceptique Conservateur",
      "progressive-advocate": "Avocat Progressiste",
      "centrist-factchecker": "Verificateur Centriste",
    } as Record<string, string>,
    langSuffix:
      "\n\nIMPORTANT: You MUST write ALL your responses (key_disagreements and perspective_summary) in French.",
  },
} as const;

export function t(locale: Locale) {
  return strings[locale];
}
