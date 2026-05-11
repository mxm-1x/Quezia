import { generateJEEQuestions, type TestConfig } from '../types/test'

// --------------------------------------------------------------------------
// Types for Internal Database
// --------------------------------------------------------------------------

export interface QuestionAttempt {
    questionId: number
    status: 'correct' | 'incorrect' | 'unattempted'
    timeSpentSeconds: number
    userAnswer?: string | number
}

export interface TestAttempt {
    id: string
    testId: string
    userId: string
    createdAt: string // ISO date

    // Aggregate Stats (computed for easy access, but could be derived)
    score: number
    totalMarks: number
    accuracy: number // percentage
    timeTakenMinutes: number

    // Granular Data for Analytics
    questionAttempts: QuestionAttempt[]
}

export interface TestVersion {
    id: string
    label: string
    createdAt: string
}

// --------------------------------------------------------------------------
// Initial Data Seeding
// --------------------------------------------------------------------------

// 1. Helper to generate a random attempt
const generateRandomAttempt = (
    attemptId: string,
    testId: string,
    daysAgo: number,
    tests: TestConfig[],
    attemptIndex: number,
    totalAttempts: number,
    persistentWeakTopics: string[],
    persistentStrongTopics: string[]
): TestAttempt => {
    const test = tests.find(t => t.id === testId)!
    const totalQuestions = test.questions.length

    let totalScore = 0
    let correctCount = 0
    let attemptedCount = 0

    // STEP 5: Refined Growth Curve (0.35 -> 0.85)
    const progressFactor = 0.35 + (attemptIndex / totalAttempts) * 0.5

    // STEP 6: Burnout Dips (Every 12th test)
    const isBurnout = attemptIndex > 0 && attemptIndex % 12 === 0

    const questionAttempts: QuestionAttempt[] = test.questions.map(q => {
        // STEP 4: Refined Persistent Topic Bias
        let topicBias = 0.6
        if (q.topic && persistentStrongTopics.includes(q.topic)) topicBias = 0.85
        if (q.topic && persistentWeakTopics.includes(q.topic)) topicBias = 0.35

        const difficultyFactor = q.difficulty === 'hard' ? 0.35 : q.difficulty === 'medium' ? 0.65 : 0.9

        // STEP 6: Revised Attempt Probability with Hard Question Penalty
        let attemptProbability =
            0.75
            + (topicBias * 0.15)
            - (q.difficulty === 'hard' ? 0.25 : 0)

        let successProbability = topicBias * difficultyFactor * (progressFactor * 1.5)

        // STEP 6 & 7: Apply multipliers
        if (isBurnout) successProbability *= 0.75
        if (test.isMock) {
            successProbability *= 0.9
            attemptProbability *= 0.95
        }

        let status: 'correct' | 'incorrect' | 'unattempted' = 'unattempted'

        if (Math.random() < attemptProbability) {
            attemptedCount++
            if (Math.random() < successProbability) {
                status = 'correct'
                correctCount++
                totalScore += (test.marking?.correct || 4)
            } else {
                status = 'incorrect'
                totalScore += (test.marking?.incorrect || -1)
            }
        }

        // STEP 4: Realistic Time Modeling
        const baseTime = q.difficulty === 'hard' ? 140 : q.difficulty === 'medium' ? 100 : 70
        const topicPenalty = q.topic && persistentWeakTopics.includes(q.topic) ? 1.3 :
            q.topic && persistentStrongTopics.includes(q.topic) ? 0.8 : 1

        const timeSpentSeconds = Math.floor(baseTime * topicPenalty * (1.1 - (progressFactor - 0.35) * 0.4))

        return {
            questionId: q.id,
            status,
            timeSpentSeconds
        }
    })

    const totalPossible = totalQuestions * (test.marking?.correct || 4)
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0
    const timeTakenMinutes = Math.floor(questionAttempts.reduce((acc, q) => acc + q.timeSpentSeconds, 0) / 60)

    // STEP 1: Date Generation
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60)) // Typical study hours

    return {
        id: attemptId,
        testId,
        userId: 'user-1',
        createdAt: date.toISOString(),
        score: Math.max(0, totalScore),
        totalMarks: totalPossible,
        accuracy: Math.round(accuracy),
        timeTakenMinutes,
        questionAttempts
    }
}

const generateMockDataset = () => {
    const tests: TestConfig[] = []
    const attempts: TestAttempt[] = []

    // STEP 4: Refined PCM Persistent Biases
    const persistentWeakTopics = ['Inorganic Chemistry', 'Electrostatics']
    const persistentStrongTopics = ['Algebra', 'Calculus', 'Mechanics']

    // STEP 1 & 2: PCM Subjects and Topics
    const subjects = ['Physics', 'Chemistry', 'Mathematics']
    const topics: Record<string, string[]> = {
        'Physics': ['Mechanics', 'Electrostatics', 'Optics', 'Thermodynamics', 'Modern Physics'],
        'Chemistry': ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Coordination Compounds', 'Chemical Bonding'],
        'Mathematics': ['Calculus', 'Algebra', 'Coordinate Geometry', 'Vectors', 'Matrices']
    }

    // First generate all tests
    for (let i = 1; i <= 100; i++) {
        const subject = subjects[i % subjects.length]
        const topic = topics[subject][i % topics[subject].length]
        const isMock = i % 10 === 0 // Fewer mocks (10%)
        const durationMinutes = isMock ? 180 : 60

        const { questions, sections } = generateJEEQuestions()

        // STEP 3: Proper PCM Distribution for Mock Tests
        const selectedQuestions = isMock
            ? [
                ...questions.filter(q => q.section === 'physics').slice(0, 25),
                ...questions.filter(q => q.section === 'chemistry').slice(0, 25),
                ...questions.filter(q => q.section === 'maths').slice(0, 25)
            ]
            : questions.filter(q => q.section?.toLowerCase() === (subject === 'Mathematics' ? 'maths' : subject.toLowerCase())).slice(0, 15)

        const testId = `test-${i}`
        const test: TestConfig = {
            id: testId,
            title: isMock ? `JEE Main Full Mock Test #${Math.ceil(i / 10)}` : `${subject}: ${topic} Mastery`,
            subject: isMock ? 'Full Syllabus' : subject,
            questions: selectedQuestions,
            sections: isMock ? sections : [{ id: (subject === 'Mathematics' ? 'maths' : subject.toLowerCase()), name: subject, startIndex: 0, endIndex: selectedQuestions.length - 1 }],
            durationMinutes,
            isMock,
            marking: { correct: 4, incorrect: -1, unattempted: 0 }
        }
        tests.push(test)
    }

    // STEP 1: Chronological Attempt Generation
    // We want ~70 attempts out of 100 tests
    const attemptIndices = Array.from({ length: 100 }, (_, i) => i)
        .filter(() => Math.random() > 0.3)

    const totalAttempts = attemptIndices.length

    attemptIndices.forEach((testIdx, i) => {
        const test = tests[testIdx]
        const isCompleted = Math.random() > 0.15 // Most are completed

        // Days ago logic: i=0 (oldest) -> 60 days ago. i=max (newest) -> 0 days ago.
        const daysAgo = Math.floor(60 - (i / totalAttempts) * 60)

        const attempt = generateRandomAttempt(
            `attempt-${test.id}`,
            test.id,
            daysAgo,
            tests,
            i,
            totalAttempts,
            persistentWeakTopics,
            persistentStrongTopics
        )

        // @ts-ignore
        attempt.isSubmitted = isCompleted

        // If not completed, it's "In Progress"
        if (!isCompleted) {
            const partial = Math.floor(attempt.questionAttempts.length * (0.2 + Math.random() * 0.5))
            attempt.questionAttempts = attempt.questionAttempts.slice(0, partial)
        }

        attempts.push(attempt)
    })

    return { tests, attempts }
}

const { tests: mockTests, attempts: mockAttempts } = generateMockDataset()

// --------------------------------------------------------------------------
// Service Methods (Database Access)
// --------------------------------------------------------------------------

export const dbRequest = async <T>(callback: () => T, delay = 600): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(callback())
        }, delay)
    })
}

export const MockDatabase = {
    getTest: (testId: string) => mockTests.find(t => t.id === testId),
    getAllTests: () => mockTests,
    getAllAttempts: () => mockAttempts,
    getAttemptsForTest: (testId: string) => mockAttempts.filter(a => a.testId === testId),
    addAttempt: (attempt: TestAttempt) => {
        mockAttempts.unshift(attempt) // Add to start
        return attempt
    },
    getQuestions: () => generateJEEQuestions().questions // Return a fresh set for reference if needed
}
