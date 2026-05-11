import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../../../components/Dashboard/GlassCard'
import PromptInput from '../../../components/common/PromptInput'
import YourTestsSection from '../../../components/Dashboard/Tests/list/YourTestsSection'
import { testEngineService } from '../../../services/test-engine/test-engine.service'
import { useAuth } from '../../../hooks/useAuth'
import { useTests } from '../../../hooks/useTests'

const Tests: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshThreads } = useTests()
  const [selectedSubject, setSelectedSubject] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [isSubjectOpen, setIsSubjectOpen] = useState(false)
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePromptSubmit = async (prompt: string) => {
    if (!user?.profile?.targetExamId) {
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create Thread
      const thread = await testEngineService.createThread({
        examId: user.profile.targetExamId,
        originType: user.role === 'ADMIN' ? 'SYSTEM' : 'GENERATED',
        title: prompt,
        baseGenerationConfig: {
          subjects: selectedSubject,
          difficulty: selectedDifficulty,
        },
      })

      // 2. Generate Version (DRAFT)
      await testEngineService.generateVersion(thread.id, {
        prompt,
        followsBlueprint: false, // Override blueprint when prompt is provided
      })

      // Refresh global threads to update sidebar
      await refreshThreads()

      // 3. Navigate to thread page
      navigate(`/dashboard/tests/thread/${thread.id}`)
    } catch (error) {
      // Failed to create test - handle silently
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg-base)] px-6 pt-60 pb-8">
      {/* Create new test section */}
      <div className="w-full">
        <GlassCard
          title="Create a New Test"
          subtitle="Describe what you want to be tested on."
        >
          <PromptInput
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            selectedDifficulty={selectedDifficulty}
            setSelectedDifficulty={setSelectedDifficulty}
            isSubjectOpen={isSubjectOpen}
            setIsSubjectOpen={setIsSubjectOpen}
            isDifficultyOpen={isDifficultyOpen}
            setIsDifficultyOpen={setIsDifficultyOpen}
            onSubmit={handlePromptSubmit}
            isLoading={isSubmitting}
          />
        </GlassCard>
      </div>

      {/* Your tests section */}
      <div className="w-full px-2 lg:px-3 mt-10">
        <YourTestsSection />
      </div>
    </div>
  )
}

export default Tests