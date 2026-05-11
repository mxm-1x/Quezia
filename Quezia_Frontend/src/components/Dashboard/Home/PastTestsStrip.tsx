import React from 'react'
import PastTestCard from './PastTestsCard'
import SectionStrip from '../../common/SectionStrip'
import { ArrowUpRight } from '@phosphor-icons/react'
import { useTests } from '../../../hooks/useTests'
import { useAuth } from '../../../hooks/useAuth'

const PastTestsStrip: React.FC = () => {
  const { threads, attempts } = useTests()
  const { user } = useAuth()

  const realTests = threads
    .filter((t) => {
      if (user?.role === 'ADMIN') return true
      return t.createdByUserId === user?.id && t.originType !== 'SYSTEM'
    })
    .map((thread) => {
      // Find the most recent attempt for this thread
      const threadAttempts = attempts.filter((a) => a.testId.startsWith(thread.id))
      const latestAttempt = [...threadAttempts].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )[0]

      let status: 'IN_PROGRESS' | 'COMPLETED' | 'GENERATED' = 'GENERATED'
      if (latestAttempt) {
        status = latestAttempt.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'
      }

      return {
        id: thread.id,
        title: thread.title,
        subject:
          (thread.baseGenerationConfig as { subjects?: string[] }).subjects?.[0] || 'General',
        exam: 'JEE', // Fallback or derive from thread.examId if mapped
        status,
        totalQuestions: 0, // Fallback if not in thread
        attemptedQuestions: 0, // Fallback
        score: latestAttempt?.totalScore ?? undefined,
        accuracy: latestAttempt?.accuracy ?? undefined,
        lastInteractedAt: latestAttempt?.startedAt || thread.createdAt,
      }
    })
  const handleOpenTest = (testId: string) => {
    window.location.href = `/dashboard/tests/thread/${testId}`
  }

  const actions = (
    <>
      <button className="h-7 w-7 rounded-md border border-white/10 hover:bg-white/5 transition" />
      <button
        onClick={() => window.location.href = '/dashboard/tests'}
        className="h-7 w-7 rounded-md border border-white/10 hover:bg-white/5 transition flex items-center justify-center"
      >
        <ArrowUpRight size={14} className="text-white" />
      </button>
    </>
  )

  return (
    <SectionStrip title="Past tests" actions={actions} className="max-w-screen-xl">
      {/* Horizontal scroll ONLY here */}
      <div className="flex gap-4 overflow-x-auto overscroll-x-contain py-3 scrollbar-none">
        {realTests.length > 0 ? (
          realTests.map((test) => (
            <PastTestCard
              key={test.id}
              id={test.id}
              title={test.title}
              subject={test.subject}
              exam={test.exam}
              status={test.status}
              totalQuestions={test.totalQuestions}
              attemptedQuestions={test.attemptedQuestions}
              score={test.score}
              accuracy={test.accuracy}
              lastInteractedAt={test.lastInteractedAt}
              onOpen={handleOpenTest}
            />
          ))
        ) : (
          <div className="py-12 px-4 text-center w-full bg-white/[0.02] rounded-2xl border border-white/5">
            <p className="text-sm text-neutral-500">No tests available yet.</p>
          </div>
        )}
      </div>
    </SectionStrip>
  )
}

export default PastTestsStrip
