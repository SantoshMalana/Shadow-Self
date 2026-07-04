interface TieredQuestion {
  text: string
  minRung: number // 1-5, the earliest rung this is appropriate to ask
}

export const trainingQuestions: TieredQuestion[] = [
  // Rung 1 — surface, safe for anyone on day one
  { text: "How do you typically start your mornings? What does your ideal day look like?", minRung: 1 },
  { text: "Describe your ideal way of working. What environment brings out your best?", minRung: 1 },
  { text: "Explain your biggest area of expertise as if I'm a complete beginner.", minRung: 1 },

  // Rung 2 — functional, light reasoning
  { text: "Describe a problem you solved recently. Walk me through your exact thought process.", minRung: 2 },
  { text: "What's a shortcut or mental model you use that most people in your field don't?", minRung: 2 },
  { text: "What's something most people get wrong about your field of expertise?", minRung: 2 },
  { text: "What's the most complex problem you've ever solved and how did you approach it?", minRung: 2 },

  // Rung 3 — personal opinions and values
  { text: "What's a belief you hold that most people around you don't share?", minRung: 3 },
  { text: "What's the most important lesson your career has taught you?", minRung: 3 },
  { text: "What advice would you give your younger self starting out in your career?", minRung: 3 },
  { text: "What's something you've changed your mind about recently?", minRung: 3 },
  { text: "When you disagree with someone, how do you handle it?", minRung: 3 },

  // Rung 4 — emotional depth
  { text: "What's the hardest decision you made this week and how did you reason through it?", minRung: 4 },
  { text: "What makes you genuinely angry? Why?", minRung: 4 },
  { text: "What do you do when you're stuck on something and can't figure it out?", minRung: 4 },
  { text: "Describe how you feel about the work you're doing right now.", minRung: 4 },

  // Rung 5 — vulnerable, contradictory territory
  { text: "What's something you're proud of that nobody knows about?", minRung: 5 },
  { text: "Tell me about a time you failed badly. What did you feel and what did you learn?", minRung: 5 },
  { text: "What do you want the people closest to you to remember about you?", minRung: 5 },
  { text: "What are you most afraid of losing?", minRung: 5 },
]

function poolForRung(depthRung: number): TieredQuestion[] {
  return trainingQuestions.filter(q => q.minRung <= depthRung)
}

export function getDailyQuestion(sessionCount: number, depthRung: number = 1): string {
  const pool = poolForRung(depthRung)
  return pool[sessionCount % pool.length].text
}

export function getRandomQuestion(depthRung: number = 1, exclude?: string): string {
  const pool = poolForRung(depthRung).filter(q => q.text !== exclude)
  return pool[Math.floor(Math.random() * pool.length)].text
}
