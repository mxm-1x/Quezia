import { useMemo, useEffect, useState } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Placeholder from '../components/common/Placeholder'
import { useParams, useNavigate } from 'react-router-dom'
import { CaretLeft, Warning, Hourglass } from '@phosphor-icons/react'
import { testEngineService, type AttemptReviewResponse, type ReviewQuestion } from '../services/test-engine/test-engine.service'

// New Redesigned Components
import CompactHeaderSummary from '../components/test-analytics/CompactHeaderSummary'
import QuestionReviewSection, { type QuestionReviewData } from '../components/test-analytics/QuestionReviewSection'
import TacticalInsightStrip from '../components/test-analytics/TacticalInsightStrip'

// Refactored Analytics Components
import SubjectPerformanceCard from '../components/test-analytics/SubjectPerformanceCard'
import TimeAnalysisCard from '../components/test-analytics/TimeAnalysisCard'
import DifficultyBreakdownCard from '../components/test-analytics/DifficultyBreakdownCard'
import TopicWeaknessCard from '../components/test-analytics/TopicWeaknessCard'
import ImprovementComparisonCard from '../components/test-analytics/ImprovementComparisonCard'

const TestAnalyticsPage = () => {
    const { attemptId } = useParams<{ attemptId: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [reviewData, setReviewData] = useState<AttemptReviewResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    // -------------------------------------------------------------------------
    // Data Fetching — single endpoint
    // -------------------------------------------------------------------------
    useEffect(() => {
        const loadReview = async () => {
            if (!attemptId) return
            try {
                setLoading(true)
                const data = await testEngineService.getAttemptReview(attemptId)
                setReviewData(data)
            } catch (err: any) {
                // Failed to load attempt review
                const status = err?.response?.status
                if (status === 404) setError('Attempt not found.')
                else if (status === 403) setError('You do not have access to this attempt.')
                else if (status === 400) setError('This attempt has not been completed yet.')
                else setError('Failed to load analytics data.')
            } finally {
                setLoading(false)
            }
        }

        loadReview()
    }, [attemptId])

    // Aliases for convenience
    const attempt = reviewData?.attempt ?? null
    const summary = reviewData?.summary ?? null
    const reviewQuestions = reviewData?.questions ?? []

    // -------------------------------------------------------------------------
    // Derived Analytics Data
    // -------------------------------------------------------------------------

    // 1. Map backend ReviewQuestion[] → QuestionReviewData[] for UI components
    const detailedQuestions = useMemo((): QuestionReviewData[] => {
        return reviewQuestions.map((rq: ReviewQuestion, idx: number) => {
            const payload = rq.contentPayload || {} as any
            const diffLower = (rq.difficulty || 'medium').toLowerCase() as 'easy' | 'medium' | 'hard'
            const statusLower = (rq.status || 'UNATTEMPTED').toLowerCase() as 'correct' | 'incorrect' | 'unattempted'

            return {
                id: idx + 1,
                section: 'General',
                subject: rq.subject ? rq.subject.charAt(0).toUpperCase() + rq.subject.slice(1) : 'General',
                topic: rq.topic || 'General',
                difficulty: diffLower,
                status: statusLower,
                marks: rq.marksAwarded ?? (statusLower === 'unattempted' ? 0 : statusLower === 'correct' ? rq.marks : -rq.negativeMarkValue),
                time: rq.timeSpentSeconds || 0,
                text: payload.question || 'Question text not available',
                options: rq.questionType === 'MCQ' && payload.options
                    ? payload.options.map((o: any) => typeof o === 'string' ? o : o.text)
                    : undefined,
                userAnswer: rq.selectedAnswer,
                correctAnswer: rq.correctAnswer,
                explanation: rq.explanation || 'Detailed solution coming soon.',
            }
        })
    }, [reviewQuestions])

    // 2. Tactical Insights
    const tacticalInsights = useMemo(() => {
        if (!detailedQuestions.length || !summary) return []
        const list: any[] = []

        const marksLost = summary.incorrect * 1
        if (marksLost > 10) {
            list.push({ type: 'critical', text: `Negative Marking (-${marksLost}m) is your biggest leak.` })
        }

        const timeSeconds = attempt?.timeSpentSeconds || 0
        const avgTime = detailedQuestions.length > 0 ? timeSeconds / detailedQuestions.length : 0
        if (avgTime > 0 && avgTime < 150) {
            list.push({ type: 'success', text: `Excellent Speed: ${Math.round(avgTime)}s per question.` })
        }

        const trickyMisses = detailedQuestions.filter(q => q.difficulty === 'hard' && q.status === 'incorrect').length
        if (trickyMisses > 3) {
            list.push({ type: 'warning', text: `Strategic Alert: ${trickyMisses} hard questions were over-attempted.` })
        }

        return list
    }, [detailedQuestions, summary, attempt])

    // 3. Subject Performance
    const subjectsData = useMemo(() => {
        const subs = ['Physics', 'Chemistry', 'Mathematics']
        return subs.map(s => {
            const qs = detailedQuestions.filter(q => q.subject.toLowerCase() === (s === 'Mathematics' ? 'maths' : s.toLowerCase()))
            const correct = qs.filter(q => q.status === 'correct').length
            const attempted = qs.filter(q => q.status !== 'unattempted').length
            const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
            const score = qs.reduce((acc, q) => acc + q.marks, 0)

            return {
                subject: s,
                score,
                maxScore: qs.length * 4,
                accuracy,
                attemptRate: qs.length > 0 ? Math.round((attempted / qs.length) * 100) : 0,
                avgTimePerQ: qs.length > 0 ? Math.round(qs.reduce((acc, q) => acc + q.time, 0) / qs.length) : 0,
                status: accuracy > 75 ? 'strong' : accuracy > 50 ? 'average' : 'weak' as any
            }
        })
    }, [detailedQuestions])

    // 4. Time Analysis
    const timeStats = useMemo(() => {
        const diffTime = (diff: string) => {
            const qs = detailedQuestions.filter(q => q.difficulty === diff && q.status !== 'unattempted')
            return qs.length > 0 ? Math.round(qs.reduce((acc, q) => acc + q.time, 0) / qs.length) : 0
        }

        return {
            avgTimeEasy: diffTime('easy'),
            avgTimeMedium: diffTime('medium'),
            avgTimeHard: diffTime('hard'),
            totalTimeSpent: attempt?.timeSpentSeconds || 0,
            slowestQuestions: [...detailedQuestions].sort((a, b) => b.time - a.time).slice(0, 4)
        }
    }, [detailedQuestions, attempt])

    // 5. Difficulty Breakdown
    const diffMatrix = useMemo(() => {
        const getStats = (diff: string) => {
            const qs = detailedQuestions.filter(q => q.difficulty === diff)
            const correct = qs.filter(q => q.status === 'correct').length
            const attempted = qs.filter(q => q.status !== 'unattempted').length
            return {
                correct,
                incorrect: attempted - correct,
                unattempted: qs.length - attempted,
                accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0
            }
        }
        return {
            easy: getStats('easy'),
            medium: getStats('medium'),
            hard: getStats('hard')
        }
    }, [detailedQuestions])

    // 6. Topic Weakness
    const weakTopics = useMemo(() => {
        const topicGroups: Record<string, typeof detailedQuestions> = {}
        detailedQuestions.forEach(q => {
            if (!topicGroups[q.topic]) topicGroups[q.topic] = []
            topicGroups[q.topic].push(q)
        })

        return Object.entries(topicGroups)
            .map(([name, qs]) => {
                const correct = qs.filter(q => q.status === 'correct').length
                const attempted = qs.filter(q => q.status !== 'unattempted').length
                const negatives = qs.filter(q => q.status === 'incorrect').length * 1
                const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
                const avgTime = Math.round(qs.reduce((acc, q) => acc + q.time, 0) / qs.length)

                return {
                    name,
                    subject: qs[0].subject,
                    accuracy,
                    negatives,
                    avgTime,
                    reason: negatives > 2 ? 'negatives' : avgTime > 120 ? 'time' : 'accuracy' as any
                }
            })
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 3)
    }, [detailedQuestions])

    // 7. Deltas
    const deltas = useMemo(() => {
        return [
            { label: 'Score', value: 0, direction: 'neutral' as any, isGood: true },
            { label: 'Accuracy', value: 0, direction: 'neutral' as any, isGood: true },
            { label: 'Time', value: 0, direction: 'neutral' as any, isGood: true },
            { label: 'Efficiency', value: 12, direction: 'up' as any, isGood: true }
        ]
    }, [])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] p-6">
                <Placeholder
                    icon={Warning}
                    variant="error"
                    title="Analysis Unavailable"
                    description={error}
                    action={{
                        label: 'Back to Analytics',
                        onClick: () => navigate('/dashboard/analytics')
                    }}
                />
            </div>
        )
    }

    if (loading) return (
        <LoadingSpinner fullScreen size="lg" message="Analyzing Performance..." />
    )

    if (!attemptId || !attempt || !summary) return null

    const timeTakenMinutes = Math.round((attempt.timeSpentSeconds || 0) / 60)
    const attemptRate = summary.totalQuestions > 0
        ? Math.round((summary.attempted / summary.totalQuestions) * 100)
        : 0

    return (
        <div className="min-h-screen bg-[#050505] text-neutral-400 font-sans selection:bg-blue-500/10">
            {/* Minimal Sticky Header */}
            <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 py-4 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard/analytics')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-white transition-colors group"
                    >
                        <CaretLeft size={16} />
                        Exit Analysis
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/dashboard/tests/thread/${attempt.threadId || attempt.testId}`)}
                            className="px-5 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-black hover:bg-neutral-200 transition-all flex items-center gap-2"
                        >
                            Retake Test
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">

                {/* Layer 1: Results & Immediate Review */}
                <div className="space-y-8">
                    <CompactHeaderSummary
                        title={`Attempt ${attempt.id.substring(0, 8)}`}
                        date={new Date(attempt.completedAt || attempt.startedAt || new Date()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        score={Number(summary.totalScore) || 0}
                        totalMarks={Number(summary.maxScore) || 300}
                        accuracy={Number(attempt.accuracy) || 0}
                        attemptRate={attemptRate}
                        timeTakenMinutes={timeTakenMinutes}
                        riskRatio={Number(attempt.riskRatio) || 0}
                    />

                    <QuestionReviewSection questions={detailedQuestions} />
                </div>

                {/* Coming Soon Placeholder for Advanced Analytics */}
                <Placeholder
                    icon={Hourglass}
                    variant="coming-soon"
                    title="Advanced Analytics Coming Soon"
                    description="Our intelligence engine is currently being calibrated to provide deeper tactical insights and performance trends."
                />

                {/* Layer 2: Tactical Insights */}
                <div className="py-2">
                    <TacticalInsightStrip insights={tacticalInsights} />
                </div>

                {/* Layer 3: Deep Analytics Matrix */}
                <div className="space-y-12 border-t border-white/5 pt-12">
                    <ImprovementComparisonCard deltas={deltas} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <SubjectPerformanceCard subjects={subjectsData} />
                        <DifficultyBreakdownCard easy={diffMatrix.easy} medium={diffMatrix.medium} hard={diffMatrix.hard} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <TimeAnalysisCard {...timeStats} />
                        <TopicWeaknessCard topics={weakTopics} />
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center pt-12">
                    <p className="text-[10px] font-black text-neutral-800 uppercase tracking-[0.3em]">
                        Quezia Intelligence Engine • JEE Advanced Standard
                    </p>
                </div>
            </div>
        </div>
    )
}

export default TestAnalyticsPage
