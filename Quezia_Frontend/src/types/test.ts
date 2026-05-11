// Shared types for test data - single source of truth

export type Section = {
  id: string
  name: string
  startIndex: number
  endIndex: number
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export type MCQQuestion = {
  id: number
  questionId?: string
  text: string
  marks: number
  type: 'mcq'
  options: (string | { key: string; text: string })[]
  section?: string
  topic?: string
  difficulty?: Difficulty
  correctAnswer?: number
  explanation?: string
}

export type NumericRules = {
  allowDecimals?: boolean
  maxDecimalPlaces?: number
  allowNegative?: boolean
  roundOnSubmit?: boolean
}

export type NumericQuestion = {
  id: number
  questionId?: string
  text: string
  marks: number
  type: 'numeric'
  hint?: string
  section?: string
  numericRules?: NumericRules
  topic?: string
  difficulty?: Difficulty
  correctAnswer?: number | string
  explanation?: string
}

export type Question = MCQQuestion | NumericQuestion

// For preview cards (simplified view)
export type PreviewQuestion = {
  id: number
  text: string
  marks: number
  options?: (string | { key: string; text: string })[]
}

// Full test configuration passed between routes
export type TestConfig = {
  id: string
  title: string
  subject?: string
  questions: Question[]
  sections?: Section[]
  durationMinutes: number
  isMock: boolean
  marking?: {
    correct: number
    incorrect: number
    unattempted: number
  }
}

// Helper to convert duration string to minutes
export function parseDuration(duration: string): number {
  const lower = duration.toLowerCase()

  // Handle "3 Hours", "3 hours", "3h"
  const hoursMatch = lower.match(/(\d+)\s*h/)
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 60
  }

  // Handle "30 mins", "30 minutes", "30m"
  const minsMatch = lower.match(/(\d+)\s*m/)
  if (minsMatch) {
    return parseInt(minsMatch[1], 10)
  }

  // Default fallback
  return 60
}

// Helper to format minutes to display string
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours} Hour${hours > 1 ? 's' : ''}`
    }
    return `${hours}h ${mins}m`
  }
  return `${minutes} mins`
}

// Generate sample questions for testing
export function generateSampleQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) => {
    // Every 10th question is a numeric type
    if ((i + 1) % 10 === 0) {
      return {
        id: i + 1,
        text: `Calculate the numerical value.`,
        marks: 4,
        type: 'numeric' as const,
        hint: 'Enter your numerical answer.',
        topic: 'General',
        difficulty: 'medium',
        correctAnswer: '42',
        explanation: 'The numerical answer is derived from basic principles.'
      }
    }
    return {
      id: i + 1,
      text: `This is a placeholder question to test the UI with ${count} questions. What is the correct answer?`,
      marks: 4,
      type: 'mcq' as const,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      topic: 'General',
      difficulty: 'easy',
      correctAnswer: 0,
      explanation: 'Option A is correct because it matches the definition.'
    }
  })
}

// JEE-style sections configuration
export const JEE_SECTIONS: Section[] = [
  { id: 'physics', name: 'Physics', startIndex: 0, endIndex: 24 },
  { id: 'chemistry', name: 'Chemistry', startIndex: 25, endIndex: 49 },
  { id: 'maths', name: 'Mathematics', startIndex: 50, endIndex: 74 },
]

// Generate JEE-style questions with 3 sections
export function generateJEEQuestions(): { questions: Question[]; sections: Section[] } {
  const sections = JEE_SECTIONS
  const questions: Question[] = []

  const sectionTopics: Record<string, string[]> = {
    physics: ['Mechanics', 'Electrostatics', 'Magnetism', 'Optics', 'Modern Physics', 'Thermodynamics', 'Kinematics'],
    chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds', 'Chemical Bonding', 'Solutions', 'Electrochemistry'],
    maths: ['Calculus', 'Algebra', 'Coordinate Geometry', 'Vectors', 'Probability', 'Matrices', 'Complex Numbers'],
  }

  sections.forEach((section) => {
    const topics = sectionTopics[section.id] || ['General']
    const questionsInSection = section.endIndex - section.startIndex + 1

    for (let i = 0; i < questionsInSection; i++) {
      const globalIndex = section.startIndex + i
      const topic = topics[i % topics.length]
      const isNumeric = i >= 20 // Last 5 questions in each section are numeric type (JEE pattern)

      // Distribute difficulty: 40% Easy, 40% Medium, 20% Hard
      const diffRoll = Math.random()
      const difficulty: Difficulty = diffRoll < 0.4 ? 'easy' : diffRoll < 0.8 ? 'medium' : 'hard'

      if (isNumeric) {
        // Vary numeric rules for different questions
        const questionInSection = i - 20 // 0-4 for numeric questions
        const numericRules: NumericRules =
          questionInSection === 0
            ? { allowDecimals: true, maxDecimalPlaces: 2, allowNegative: true }
            : questionInSection === 1
              ? { allowDecimals: false, allowNegative: true }
              : questionInSection === 2
                ? { allowDecimals: true, maxDecimalPlaces: 1, allowNegative: false }
                : questionInSection === 3
                  ? { allowDecimals: false, allowNegative: false, roundOnSubmit: true }
                  : { allowDecimals: false, allowNegative: true }

        const hintText = numericRules.allowDecimals
          ? `Enter value up to ${numericRules.maxDecimalPlaces} decimal places`
          : numericRules.roundOnSubmit
            ? 'Answer will be rounded to the nearest whole number'
            : 'Enter the final numerical value'

        questions.push({
          id: globalIndex + 1,
          text: `Calculate the numerical value for this ${topic.toLowerCase()} problem. (${difficulty})`,
          marks: 4,
          type: 'numeric',
          hint: hintText,
          section: section.id,
          numericRules,
          topic,
          difficulty,
          correctAnswer: Math.floor(Math.random() * 100),
          explanation: `To find the numerical value for this ${topic.toLowerCase()} problem, we apply the standard formula for ${topic} and plug in the given values for ${difficulty} level complexity.`
        })
      } else {
        questions.push({
          id: globalIndex + 1,
          text: `This is a ${difficulty} ${topic.toLowerCase()} question. Which of the following is correct?`,
          marks: 4,
          type: 'mcq',
          options: [
            `Option A related to ${topic}`,
            `Option B related to ${topic}`,
            `Option C related to ${topic}`,
            `Option D related to ${topic}`,
          ],
          section: section.id,
          topic,
          difficulty,
          correctAnswer: Math.floor(Math.random() * 4),
          explanation: `In ${topic}, the concept of ${difficulty} level questions usually involves verifying the relationship between the given options. Option ${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]} is correct because it satisfies the principle of ${topic}.`
        })
      }
    }
  })

  return { questions, sections }
}
