export const trainingQuestions = [
  // Thinking style
  "What's the hardest decision you made this week and how did you reason through it?",
  "Describe a problem you solved recently. Walk me through your exact thought process.",
  "What's something most people get wrong about your field of expertise?",
  "When you disagree with someone, how do you handle it?",

  // Values and opinions
  "What's a belief you hold that most people around you don't share?",
  "What makes you genuinely angry? Why?",
  "What's the most important lesson your career has taught you?",
  "Describe your ideal way of working. What environment brings out your best?",

  // Emotional depth
  "What's something you're proud of that nobody knows about?",
  "Tell me about a time you failed badly. What did you feel and what did you learn?",
  "What do you want the people closest to you to remember about you?",
  "What are you most afraid of losing?",

  // Knowledge and expertise
  "Explain your biggest area of expertise as if I'm a complete beginner.",
  "What's a shortcut or mental model you use that most people in your field don't?",
  "What advice would you give your younger self starting out in your career?",
  "What's the most complex problem you've ever solved and how did you approach it?",

  // Day to day personality
  "How do you typically start your mornings? What does your ideal day look like?",
  "What do you do when you're stuck on something and can't figure it out?",
  "Describe how you feel about the work you're doing right now.",
  "What's something you've changed your mind about recently?"
]

export function getDailyQuestion(sessionCount: number): string {
  return trainingQuestions[sessionCount % trainingQuestions.length]
}

export function getRandomQuestion(exclude?: string): string {
  const filtered = trainingQuestions.filter(q => q !== exclude)
  return filtered[Math.floor(Math.random() * filtered.length)]
}
