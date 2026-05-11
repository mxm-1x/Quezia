import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import TestPreviewRulesCard, { type TestInstructionsPreset } from '../../../components/Dashboard/Tests/preview/TestPreviewRulesCard'
import { formatDuration } from '../../../types/test'
import { type TestConfig } from '../../../types/test'
import { testEngineService } from '../../../services/test-engine/test-engine.service'

const TestPreviewRules: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Get testConfig from route state (passed from TestsThread or TestAnalyticsPage)
  const routeState = location.state as { testConfig?: TestConfig } | null
  const testConfig = routeState?.testConfig

  // Track duration changes (for custom tests)
  const [durationMinutes, setDurationMinutes] = useState(
    testConfig?.durationMinutes ?? 180
  )

  const dynamicPreset = useMemo((): TestInstructionsPreset => {
    if (!testConfig) {
      return {
        title: 'Test Session',
        duration: formatDuration(durationMinutes),
        marking: {
          correct: '+4 marks',
          incorrect: '−1 mark',
          unattempted: '0 marks',
        },
        rules: [
          'All questions are compulsory.',
          'You may navigate freely between questions.',
          'Answers can be changed before final submission.',
          'The test will auto-submit when the timer ends.',
        ],
      }
    }

    return {
      title: testConfig.title,
      subtitle: testConfig.subject,
      duration: formatDuration(durationMinutes),
      sections: testConfig.sections?.map(s => s.name),
      marking: {
        correct: `+${testConfig.marking?.correct || 4} marks`,
        incorrect: `${testConfig.marking?.incorrect || -1} mark${testConfig.marking?.incorrect === -1 ? '' : 's'}`,
        unattempted: `${testConfig.marking?.unattempted || 0} marks`,
      },
      rules: [
        'All questions are compulsory.',
        'You may navigate freely between questions.',
        'Answers can be changed before final submission.',
        'The test will auto-submit when the timer ends.',
        'Avoid refreshing or leaving the test window.',
        ...(testConfig.isMock ? ['Simulated under real exam conditions.'] : [])
      ],
      queziaNote: 'Quezia will analyze your performance and strategy after submission.'
    }
  }, [testConfig, durationMinutes])

  const handleStart = async () => {
    if (!testConfig?.id) {
      return
    }

    try {
      // Start a new attempt
      const attempt = await testEngineService.startAttempt(testConfig.id)
      
      // Navigate to the test session with the new attempt ID
      navigate(`/dashboard/tests/thread/${threadId}/attempt/${attempt.id}`)
    } catch (error) {
      // Failed to start test attempt - handle silently
    }
  }

  const handleDurationChange = (minutes: number) => {
    setDurationMinutes(minutes)
  }

  return (
    <div className="relative h-screen bg-[var(--color-bg-base)] px-4 py-6 flex items-center justify-center">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-4 flex items-center gap-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <TestPreviewRulesCard
        preset={dynamicPreset}
        questionsCount={testConfig?.questions?.length || (testConfig as any)?.totalQuestions}
        onStart={handleStart}
        onDurationChange={handleDurationChange}
        mock={true}
      />
    </div>
  )
}

export default TestPreviewRules
