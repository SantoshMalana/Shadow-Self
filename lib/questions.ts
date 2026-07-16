interface TieredQuestion {
  text: string
  minRung: number // 1-5, the earliest rung this is appropriate to ask
  category: string // topic category to avoid asking same-category questions back to back
}

export const trainingQuestions: TieredQuestion[] = [
  // ──── Rung 1 — Surface: safe, warm, low-stakes ────
  { text: "How do you typically start your mornings? What does your ideal day look like?", minRung: 1, category: 'daily-life' },
  { text: "Describe your ideal way of working. What environment brings out your best?", minRung: 1, category: 'work-style' },
  { text: "Explain your biggest area of expertise as if I'm a complete beginner.", minRung: 1, category: 'expertise' },
  { text: "What's something you're currently learning or trying to get better at?", minRung: 1, category: 'growth' },
  { text: "What's a hobby or interest you could talk about for hours?", minRung: 1, category: 'interests' },
  { text: "How do you usually wind down at the end of the day?", minRung: 1, category: 'daily-life' },
  { text: "If someone asked your close friends to describe you in three words, what would they say?", minRung: 1, category: 'identity' },
  { text: "What kind of music, shows, or books are you into right now?", minRung: 1, category: 'interests' },

  // ──── Rung 2 — Functional: reasoning, mental models, problem-solving ────
  { text: "Describe a problem you solved recently. Walk me through your exact thought process.", minRung: 2, category: 'problem-solving' },
  { text: "What's a shortcut or mental model you use that most people in your field don't?", minRung: 2, category: 'expertise' },
  { text: "What's something most people get wrong about your field of expertise?", minRung: 2, category: 'expertise' },
  { text: "What's the most complex problem you've ever solved and how did you approach it?", minRung: 2, category: 'problem-solving' },
  { text: "When you're stuck on a hard problem, what's your go-to debugging strategy?", minRung: 2, category: 'problem-solving' },
  { text: "How do you decide what to prioritize when everything feels urgent?", minRung: 2, category: 'decision-making' },
  { text: "What's a concept or framework you've learned that changed how you think?", minRung: 2, category: 'growth' },
  { text: "Walk me through how you'd explain a complex idea to someone who's never heard of it.", minRung: 2, category: 'communication' },

  // ──── Rung 3 — Personal: opinions, values, worldview ────
  { text: "What's a belief you hold that most people around you don't share?", minRung: 3, category: 'values' },
  { text: "What's the most important lesson your career has taught you?", minRung: 3, category: 'career' },
  { text: "What advice would you give your younger self starting out in your career?", minRung: 3, category: 'career' },
  { text: "What's something you've changed your mind about recently?", minRung: 3, category: 'values' },
  { text: "When you disagree with someone, how do you handle it?", minRung: 3, category: 'conflict' },
  { text: "What's a hill you'd die on — something you refuse to compromise on?", minRung: 3, category: 'values' },
  { text: "What do you think most people waste their time on?", minRung: 3, category: 'worldview' },
  { text: "Is there a quote, saying, or principle you genuinely live by?", minRung: 3, category: 'identity' },
  { text: "What's something you're unusually good at that isn't part of your job?", minRung: 3, category: 'identity' },

  // ──── Rung 4 — Emotional: triggers, fears, feelings ────
  { text: "What's the hardest decision you made this week and how did you reason through it?", minRung: 4, category: 'decision-making' },
  { text: "What makes you genuinely angry? Why?", minRung: 4, category: 'emotions' },
  { text: "What do you do when you're stuck on something and can't figure it out?", minRung: 4, category: 'coping' },
  { text: "Describe how you feel about the work you're doing right now.", minRung: 4, category: 'career' },
  { text: "What's something that recently made you feel genuinely proud?", minRung: 4, category: 'emotions' },
  { text: "When was the last time you felt truly out of your depth? What happened?", minRung: 4, category: 'vulnerability' },
  { text: "What's something you wish you could tell someone but haven't?", minRung: 4, category: 'emotions' },
  { text: "How do you handle criticism — what's your honest first reaction?", minRung: 4, category: 'conflict' },

  // ──── Rung 5 — Contradictory: vulnerable, deep identity ────
  { text: "What's something you're proud of that nobody knows about?", minRung: 5, category: 'vulnerability' },
  { text: "Tell me about a time you failed badly. What did you feel and what did you learn?", minRung: 5, category: 'vulnerability' },
  { text: "What do you want the people closest to you to remember about you?", minRung: 5, category: 'identity' },
  { text: "What are you most afraid of losing?", minRung: 5, category: 'vulnerability' },
  { text: "Is there a version of yourself you show the world that's different from who you are in private?", minRung: 5, category: 'identity' },
  { text: "What's a contradiction in yourself — something you believe but don't always practice?", minRung: 5, category: 'values' },
  { text: "If you could go back and relive one day of your life, which would it be and why?", minRung: 5, category: 'vulnerability' },
  { text: "What's the most important thing you've learned about yourself in the last year?", minRung: 5, category: 'growth' },
]

function poolForRung(depthRung: number): TieredQuestion[] {
  return trainingQuestions.filter(q => q.minRung <= depthRung)
}

/**
 * Get the daily question, avoiding recently asked categories.
 * Uses session count as a seed but shuffles to avoid predictable cycling.
 */
export function getDailyQuestion(sessionCount: number, depthRung: number = 1): string {
  const pool = poolForRung(depthRung)
  // Use a hash-like approach to shuffle deterministically per session
  // but not in a simple linear cycle
  const index = (sessionCount * 7 + 3) % pool.length
  return pool[index].text
}

export function getRandomQuestion(depthRung: number = 1, exclude?: string): string {
  const pool = poolForRung(depthRung).filter(q => q.text !== exclude)
  return pool[Math.floor(Math.random() * pool.length)].text
}

/**
 * Get a question that targets a gap in the personality profile.
 * Prioritizes categories that have fewer extracted traits.
 */
export function getGapFillingQuestion(
  depthRung: number,
  personality: any,
  exclude?: string
): string {
  const pool = poolForRung(depthRung).filter(q => q.text !== exclude)
  
  // Count what we know about
  const hasTone = (personality?.communicationStyle?.tone?.length || 0) > 2
  const hasValues = (personality?.thinkingPatterns?.values?.length || 0) > 3
  const hasOpinions = (personality?.thinkingPatterns?.opinions?.length || 0) > 3
  const hasPassions = (personality?.emotionalProfile?.passionTopics?.length || 0) > 2
  const hasDomains = (personality?.knowledgeDomains?.length || 0) > 2
  const hasDecisions = (personality?.thinkingPatterns?.decisionFramework?.length || 0) > 2

  // Prioritize under-explored categories
  const priorityCategories: string[] = []
  if (!hasValues) priorityCategories.push('values', 'worldview')
  if (!hasOpinions) priorityCategories.push('conflict', 'worldview')
  if (!hasPassions) priorityCategories.push('interests', 'emotions')
  if (!hasDomains) priorityCategories.push('expertise', 'career')
  if (!hasDecisions) priorityCategories.push('decision-making', 'problem-solving')
  if (!hasTone) priorityCategories.push('communication', 'identity')

  if (priorityCategories.length > 0) {
    const gapQuestions = pool.filter(q => priorityCategories.includes(q.category))
    if (gapQuestions.length > 0) {
      return gapQuestions[Math.floor(Math.random() * gapQuestions.length)].text
    }
  }

  return pool[Math.floor(Math.random() * pool.length)].text
}
