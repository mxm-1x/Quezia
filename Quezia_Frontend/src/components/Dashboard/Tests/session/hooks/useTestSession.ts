import { useState, useCallback, useMemo, useEffect } from 'react'
import { type SessionQuestion } from '../QuestionWorkspace'
import { type QuestionStatus } from '../../navigation/QuestionLegend'

type QuestionState = {
  id: number
  selectedAnswer: number | null
  numericAnswer: string
  isMarkedForReview: boolean
}

type UseTestSessionReturn = {
  currentIndex: number
  currentQuestion: SessionQuestion
  selectedAnswer: number | null
  numericAnswer: string
  isMarkedForReview: boolean
  questionStates: { id: number; status: QuestionStatus }[]
  canGoPrevious: boolean
  canGoNext: boolean
  goToQuestion: (index: number) => void
  goToPrevious: () => void
  goToNext: () => void
  selectAnswer: (index: number) => void
  setNumericAnswer: (value: string) => void
  toggleMarkForReview: () => void
  clearResponse: () => void
}

export function useTestSession(questions: SessionQuestion[]): UseTestSessionReturn {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([])

  // Sync states when questions are loaded
  useEffect(() => {
    if (questions.length > 0) {
      setQuestionStates(
        questions.map((q) => ({
          id: q.id,
          selectedAnswer: null,
          numericAnswer: '',
          isMarkedForReview: false,
        }))
      )
    }
  }, [questions])

  const currentQuestion = questions[currentIndex]
  const currentState = questionStates[currentIndex]

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < questions.length - 1

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index)
    }
  }, [questions.length])

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [canGoPrevious])

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [canGoNext])

  const selectAnswer = useCallback((answerIndex: number) => {
    setQuestionStates((prev) =>
      prev.map((state, i) =>
        i === currentIndex
          ? { ...state, selectedAnswer: state.selectedAnswer === answerIndex ? null : answerIndex }
          : state
      )
    )
  }, [currentIndex])

  const setNumericAnswer = useCallback((value: string) => {
    setQuestionStates((prev) =>
      prev.map((state, i) =>
        i === currentIndex ? { ...state, numericAnswer: value } : state
      )
    )
  }, [currentIndex])

  const toggleMarkForReview = useCallback(() => {
    setQuestionStates((prev) =>
      prev.map((state, i) =>
        i === currentIndex ? { ...state, isMarkedForReview: !state.isMarkedForReview } : state
      )
    )
  }, [currentIndex])

  const clearResponse = useCallback(() => {
    setQuestionStates((prev) =>
      prev.map((state, i) =>
        i === currentIndex ? { ...state, selectedAnswer: null, numericAnswer: '' } : state
      )
    )
  }, [currentIndex])

  const paletteStates = useMemo(() => {
    return questionStates.map((state, index) => {
      const question = questions[index]
      if (!question) return { id: state.id, status: 'unattempted' as QuestionStatus }

      const hasAnswer = question.type === 'mcq'
        ? state.selectedAnswer !== null
        : state.numericAnswer !== ''

      let status: QuestionStatus = 'unattempted'
      if (state.isMarkedForReview) {
        status = 'marked'
      } else if (hasAnswer) {
        status = 'attempted'
      }
      return { id: state.id, status }
    })
  }, [questionStates, questions])

  return {
    currentIndex,
    currentQuestion,
    selectedAnswer: currentState?.selectedAnswer ?? null,
    numericAnswer: currentState?.numericAnswer ?? '',
    isMarkedForReview: currentState?.isMarkedForReview ?? false,
    questionStates: paletteStates,
    canGoPrevious,
    canGoNext,
    goToQuestion,
    goToPrevious,
    goToNext,
    selectAnswer,
    setNumericAnswer,
    toggleMarkForReview,
    clearResponse,
  }
}
