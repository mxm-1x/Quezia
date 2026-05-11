import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { GridFour, Check, Flag, Circle } from '@phosphor-icons/react'
import TestSessionHeader from './TestSessionHeader'
import TestSessionFooter from './TestSessionFooter'
import QuestionWorkspace from './QuestionWorkspace'
import QuestionPalette from '../navigation/QuestionPalette'
import ReportIssueModal from '../../../common/ReportIssueModal'
import { useTestSession } from './hooks/useTestSession'
import { testEngineService, type Test } from '../../../../services/test-engine/test-engine.service'
import LoadingSpinner from '../../../common/LoadingSpinner'
import { type Question } from '../../../../types/test'

const TestSession: React.FC = () => {
  const { threadId, attemptId } = useParams<{ threadId: string; attemptId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Get test from route state (passed from TestsThread)
  const routeState = location.state as { test?: Test } | null
  const test = routeState?.test

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    currentIndex,
    currentQuestion,
    selectedAnswer,
    numericAnswer,
    isMarkedForReview,
    questionStates,
    canGoPrevious,
    canGoNext,
    goToQuestion,
    goToPrevious,
    goToNext,
    selectAnswer,
    setNumericAnswer,
    toggleMarkForReview,
    clearResponse,
  } = useTestSession(questions)

  useEffect(() => {
    const loadQuestions = async () => {
      if (!attemptId) return
      try {
        const fetchedQuestions = await testEngineService.getAttemptQuestions(attemptId)
        const mappedQuestions: Question[] = fetchedQuestions.map(q => {
          const type = q.questionType.toLowerCase() as 'mcq' | 'numeric';
          const base = {
            id: q.sequence, // Using sequence as id for order
            questionId: q.questionId,
            type,
            text: q.contentPayload.question,
            marks: q.marks,
            topic: q.topic,
          };

          if (type === 'mcq') {
            return {
              ...base,
              type: 'mcq',
              options: q.contentPayload.options || [],
            } as Question;
          } else {
            return {
              ...base,
              type: 'numeric',
            } as Question;
          }
        });

        setQuestions(mappedQuestions);

        // Use duration from test rules if available
        const duration = test?.ruleSnapshot?.totalTimeSeconds ?? 180 * 60
        setTimeRemaining(duration)
      } catch (error) {
        // Failed to load questions - handle silently
        navigate(`/dashboard/tests/thread/${threadId}`)
      } finally {
        setIsLoading(false)
      }
    }
    loadQuestions()
  }, [attemptId, threadId, test])

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || isLoading) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isSubmitted, isLoading])

  const handleAutoSubmit = async () => {
    if (isSubmitted) return
    setIsSubmitted(true)
    await handleSubmit()
  }

  // Handle individual answer submission (sync with backend)
  useEffect(() => {
    if (!attemptId || !currentQuestion || isSubmitted) return

    const submitAnswer = async () => {
      let answer: string | undefined

      if (currentQuestion.type === 'mcq') {
        const mcq = currentQuestion as any // Cast to access options
        const selectedOption = mcq.options?.[selectedAnswer as number]
        answer = typeof selectedOption === 'string'
          ? String.fromCharCode(65 + (selectedAnswer as number))
          : selectedOption?.key
      } else {
        answer = numericAnswer
      }

      if (answer !== undefined && answer !== null && answer !== '' && currentQuestion.questionId) {
        try {
          await testEngineService.submitAnswer(attemptId, {
            questionId: currentQuestion.questionId,
            answer: String(answer),
            timeSpentSeconds: 0
          })
        } catch (error) {
          // Answer syncing failed silently
        }
      }
    }

    const timer = setTimeout(submitAnswer, 1000) // Debounce
    return () => clearTimeout(timer)
  }, [selectedAnswer, numericAnswer, attemptId, currentQuestion, isSubmitted, questions, currentIndex])

  const handleSubmit = async () => {
    if (!attemptId || isSubmitting) return
    setIsSubmitting(true)
    try {
      const result = await testEngineService.submitTest(attemptId)
      setIsSubmitted(true)
      navigate(`/dashboard/tests/thread/${threadId}/result/${attemptId}`, {
        state: { result, test }
      })
    } catch (error) {
      // Failed to submit test
      setIsSubmitting(false)
    }
  }

  // Format time remaining as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const stats = {
    total: questions.length,
    attempted: questionStates.filter((q) => q.status === 'attempted').length,
    unattempted: questionStates.filter((q) => q.status === 'unattempted').length,
    markedForReview: questionStates.filter((q) => q.status === 'marked').length,
  }

  // Map backend sections to palette-compatible sections
  const mappedSections = test?.sectionSnapshot?.reduce((acc: any[], s, idx) => {
    const prevSection = acc[idx - 1]
    const startIndex = prevSection ? prevSection.endIndex + 1 : 0
    acc.push({
      id: s.id,
      name: s.subject,
      startIndex,
      endIndex: startIndex + s.questionCount - 1
    })
    return acc
  }, [])

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Setting up your test environment..." />
  }

  return (
    <div className="h-screen bg-[var(--color-bg-base)] flex flex-col">
      <TestSessionHeader
        title={test?.threadId ? `Test Attempt` : 'Test Session'}
        subject={test?.sectionSnapshot?.[0]?.subject || 'Multiple Subjects'}
        timeRemaining={formatTime(timeRemaining)}
        stats={stats}
        onSubmit={handleSubmit}
      />

      <div className="flex-1 pt-14 pb-16 overflow-y-auto">
        {currentQuestion && (
          <QuestionWorkspace
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedAnswer={selectedAnswer}
            numericAnswer={numericAnswer}
            isMarkedForReview={isMarkedForReview}
            onSelectAnswer={selectAnswer}
            onNumericChange={setNumericAnswer}
            onMarkForReview={toggleMarkForReview}
            onClearResponse={clearResponse}
            onReportIssue={() => setIsReportModalOpen(true)}
          />
        )}
      </div>

      <div
        className={`group fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center transition-transform duration-200 ${isPaletteOpen ? 'translate-x-80' : ''
          }`}
      >
        {!isPaletteOpen && (
          <div className="flex items-center gap-4 px-4 h-14 rounded-l-lg border border-r-0 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150">
            <div className="flex items-center gap-1.5">
              <Check size={12} weight="bold" className="text-[var(--color-on-success)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">{stats.attempted}</span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Attempted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flag size={12} weight="fill" className="text-[var(--color-on-warning)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">{stats.markedForReview}</span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Marked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle size={12} className="text-[var(--color-text-tertiary)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">{stats.unattempted}</span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Left</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsPaletteOpen((prev) => !prev)}
          className={`flex items-center justify-center w-10 h-14 border border-r-0 transition-colors ${isPaletteOpen
            ? 'rounded-l-lg bg-[var(--color-bg-muted)] border-[var(--color-border-strong)] text-[var(--color-text-primary)]'
            : 'rounded-l-lg bg-[var(--color-bg-surface)] border-[var(--color-border-default)] text-[var(--color-text-tertiary)] group-hover:bg-[var(--color-bg-subtle)] group-hover:text-[var(--color-text-primary)] group-hover:rounded-none group-hover:border-l-0'
            }`}
          title="Toggle question palette"
        >
          <GridFour size={18} />
        </button>
      </div>

      <QuestionPalette
        questions={questionStates}
        sections={mappedSections}
        currentIndex={currentIndex}
        onSelect={goToQuestion}
        onClose={() => setIsPaletteOpen(false)}
        isOpen={isPaletteOpen}
      />

      <TestSessionFooter
        currentQuestion={currentIndex + 1}
        totalQuestions={questions.length}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onTogglePalette={() => setIsPaletteOpen((prev) => !prev)}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        isPaletteOpen={isPaletteOpen}
      />

      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        questionNumber={currentIndex + 1}
        questionId={currentQuestion?.id}
        testId={test?.id}
      />

      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-[var(--color-bg-base)]/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingSpinner size="lg" message="Submitting your test..." />
        </div>
      )}
    </div>
  )
}

export default TestSession

