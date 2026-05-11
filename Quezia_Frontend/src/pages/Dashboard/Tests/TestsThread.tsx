import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ThreadHeader from '../../../components/Dashboard/Tests/thread/ThreadHeader'
import TestPreviewCanvas from '../../../components/Dashboard/Tests/preview/TestPreviewCanvas'
import PromptInput from '../../../components/common/PromptInput'
import { testEngineService, type Test, type TestThread, type Attempt, type TestQuestion } from '../../../services/test-engine/test-engine.service'
import { type Attempt as UIAttempt } from '../../../components/Dashboard/Tests/analytics/AttemptsAnalyticsPopup'
import { useAuth } from '../../../hooks/useAuth'
import { useTests } from '../../../hooks/useTests'
import LoadingSpinner from '../../../components/common/LoadingSpinner'
import Placeholder from '../../../components/common/Placeholder'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { ClipboardText } from '@phosphor-icons/react'

const TestsThread: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshThreads } = useTests()

  // Data State
  const [thread, setThread] = useState<TestThread | null>(null)
  const [currentTest, setCurrentTest] = useState<Test | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeletingThread, setIsDeletingThread] = useState(false)

  // Prompt submission state
  const [isSubmittingPrompt, setIsSubmittingPrompt] = useState(false)

  // PromptInput state
  const [selectedSubject, setSelectedSubject] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [isSubjectOpen, setIsSubjectOpen] = useState(false)
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false)

  const loadData = React.useCallback(async () => {
    if (!threadId) return
    setIsLoading(true)
    try {
      // Always fetch the thread info first
      const fetchedThread = await testEngineService.getThread(threadId)
      setThread(fetchedThread)

      // Try to fetch the latest version, but handle 404 gracefully
      try {
        const fetchedTest = await testEngineService.getLatestVersion(threadId)
        setCurrentTest(fetchedTest)

        // Only fetch questions if we have a test
        if (fetchedTest) {
          const fetchedQuestions = await testEngineService.getTestQuestions(fetchedTest.id)
          setQuestions(fetchedQuestions)
        }
      } catch (versionError: any) {
        if (versionError?.response?.status === 404) {
          // No latest version exists yet - this is normal for new threads
          setCurrentTest(null)
          setQuestions([])
        } else {
          throw versionError // Re-throw non-404 errors
        }
      }

      // Fetch real attempts for this thread
      const fetchedAttempts = await testEngineService.getAttempts(threadId)
      setAttempts(fetchedAttempts)
    } catch (error) {
      // Failed to load thread data - handle silently or show error state
      console.error('Failed to load thread data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStartTest = async () => {
    if (!currentTest || currentTest.status !== 'PUBLISHED') {
      return
    }

    // Navigate to preview/rules instead of starting directly
    navigate(`/dashboard/tests/thread/${threadId}/preview`, {
      state: { testConfig: { ...currentTest, title: thread?.title || currentTest.id } }
    })
  }

  const handlePublish = async () => {
    if (!currentTest) return
    try {
      await testEngineService.publishTest(currentTest.id)
      await loadData()
    } catch (error) {
      // Failed to publish test - handle silently
    }
  }

  const handleInjectQuestions = async () => {
    if (!currentTest || !currentTest.sectionSnapshot?.[0]) return

    const sectionId = currentTest.sectionSnapshot[0].id
    const dummyQuestions = [
      {
        questionId: `q-${Date.now()}-1`,
        version: 1,
        subject: 'physics',
        topic: 'Mechanics',
        subtopic: 'Kinematics',
        difficulty: 'MEDIUM' as const,
        questionType: 'MCQ' as const,
        contentPayload: {
          question: 'What is the acceleration due to gravity on Earth?',
          options: [
            { key: 'A', text: '9.8 m/s²' },
            { key: 'B', text: '8.9 m/s²' },
            { key: 'C', text: '10.5 m/s²' },
            { key: 'D', text: '7.2 m/s²' }
          ]
        },
        correctAnswer: 'A',
        explanation: 'The standard gravity is approximately 9.8 m/s².',
        marks: 4
      },
      {
        questionId: `q-${Date.now()}-2`,
        version: 1,
        subject: 'physics',
        topic: 'Mechanics',
        subtopic: 'Forces',
        difficulty: 'EASY' as const,
        questionType: 'NUMERIC' as const,
        contentPayload: {
          question: 'What is the force required to accelerate a 5kg mass at 2 m/s²? (in Newtons)'
        },
        correctAnswer: '10',
        explanation: 'F = m * a = 5 * 2 = 10N',
        marks: 4,
        numericTolerance: 0
      }
    ]

    try {
      await testEngineService.injectQuestions(currentTest.id, {
        sectionId,
        questions: dummyQuestions
      })
      await loadData()
    } catch (error) {
      // Failed to inject questions - handle silently
    }
  }

  const handleThreadDelete = async () => {
    if (!threadId) return
    setIsDeletingThread(true)
    try {
      await testEngineService.deleteThread(threadId)
      await refreshThreads()
      navigate('/dashboard/tests')
    } catch (error) {
      // Failed to delete thread - handle silently
    } finally {
      setIsDeletingThread(false)
      setShowDeleteModal(false)
    }
  }

  const handlePromptSubmit = async (prompt: string) => {
    if (!threadId) {
      return
    }

    setIsSubmittingPrompt(true)
    try {
      // Generate new version with the prompt
      await testEngineService.generateVersion(threadId, {
        prompt,
        followsBlueprint: false, // Override blueprint when prompt is provided
      })

      // Reload the test data to show the updated version
      await loadData()
    } catch (error) {
      // Failed to update test - handle silently
    } finally {
      setIsSubmittingPrompt(false)
    }
  }

  const previewQuestions = questions.map((q) => ({
    id: q.sequence,
    text: q.contentPayload.question,
    marks: q.marks,
    options: q.questionType === 'MCQ' ? q.contentPayload.options : undefined,
  }))

  const uiAttempts: UIAttempt[] = attempts.map(a => ({
    id: a.id,
    score: a.totalScore || 0,
    totalMarks: (currentTest?.totalQuestions || 0) * 4,
    accuracy: a.accuracy || 0,
    timeTakenMinutes: Math.floor((a.timeSpentSeconds || 0) / 60),
    createdAt: a.startedAt
  }))

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading test details..." />
  }

  return (
    <div className='h-screen flex flex-col overflow-hidden bg-[var(--color-bg-base)] px-4 pb-4 pt-2'>
      <ThreadHeader
        threadId={threadId || ''}
        title={thread?.title}
        attempts={uiAttempts}
        onStartTest={handleStartTest}
        showDelete={thread?.originType === 'GENERATED' && thread?.createdByUserId === user?.id}
        onDelete={() => setShowDeleteModal(true)}
      />

      <div className="flex-1 flex flex-col min-h-0 relative">
        <TestPreviewCanvas
          prompt={thread?.title || "Test Thread"}
          versions={currentTest ? [{ id: currentTest.id, label: `v${currentTest.versionNumber}`, createdAt: new Date(currentTest.createdAt).toLocaleDateString() }] : []}
          questions={previewQuestions as any}
          onStartTest={handleStartTest}
          testId={threadId || ''}
        />

        {(!currentTest || previewQuestions.length === 0) && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-base)]/50 backdrop-blur-sm z-10">
            <Placeholder
              icon={ClipboardText}
              title={!currentTest ? "No Test Version Yet" : "No Questions Yet"}
              description={!currentTest ? "This thread doesn't have any test versions. Use the prompt below to generate a test." : "This test thread doesn't have any questions. Use the prompt below to generate some or refine the test."}
              variant="default"
            />
          </div>
        )}

        {user?.role === 'ADMIN' && currentTest?.status === 'DRAFT' && (
          <div className="absolute top-4 right-20 flex gap-2">
            <button
              onClick={handleInjectQuestions}
              className="bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-[var(--color-accent)] hover:text-white transition"
            >
              Inject Dummy Questions
            </button>
            <button
              onClick={handlePublish}
              className="bg-[var(--color-on-success)] text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition"
            >
              Publish Test
            </button>
          </div>
        )}
      </div>

      {/* PROMPT INPUT */}
      <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4">
        <PromptInput
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          isSubjectOpen={isSubjectOpen}
          setIsSubjectOpen={setIsSubjectOpen}
          isDifficultyOpen={isDifficultyOpen}
          setIsDifficultyOpen={setIsDifficultyOpen}
          openUp
          placeholder="Refine or customize this test..."
          onSubmit={handlePromptSubmit}
          isLoading={isSubmittingPrompt}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeletingThread && setShowDeleteModal(false)}
        title="Delete Test Thread"
        description={`Are you sure you want to delete "${thread?.title || 'this thread'}"? This will permanently remove all tests and attempts associated with it.`}
        confirmButton={{
          label: isDeletingThread ? 'Deleting...' : 'Delete',
          onClick: handleThreadDelete,
          variant: 'danger',
          loading: isDeletingThread,
        }}
        cancelButton={{
          label: 'Cancel',
          onClick: () => setShowDeleteModal(false),
        }}
      />
    </div>
  )
}

export default TestsThread
