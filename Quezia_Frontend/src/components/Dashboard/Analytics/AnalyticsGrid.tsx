import React from 'react'
import PerformanceTrendChart from './charts/PerformanceTrendChart'
import RankComparisonChart from './charts/RankComparisonChart'
import SubjectMasteryChart from './charts/SubjectMasteryChart'
import TimeEfficiencyChart from './charts/TimeEfficiencyChart'
import TopicPerformanceTable from './charts/TopicPerformanceTable'
import AIInsightCard from './Insights/AIInsightCard'
import type { PerformanceTrendPoint, RankComparisonPoint, SubjectMastery, TopicHealth, TimeEfficiencyPoint } from './types'

// Define props to accept data for all sub-components
interface Props {
    performanceData: PerformanceTrendPoint[]
    rankData: RankComparisonPoint[]
    subjectData: SubjectMastery[]
    timeData: TimeEfficiencyPoint[]
    topicData: TopicHealth[]
    insights: string[]
}

const AnalyticsGrid: React.FC<Props> = ({
    performanceData,
    rankData,
    subjectData,
    timeData,
    topicData,
    insights
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)]">
            {/* Row 1: Main Trend & Insights (Dominant Visuals) */}
            <div className="lg:col-span-8 h-[400px]">
                <PerformanceTrendChart data={performanceData} />
            </div>
            <div className="lg:col-span-4 h-[400px]">
                <AIInsightCard insights={insights} />
            </div>

            {/* Row 2: Secondary Analysis */}
            <div className="lg:col-span-4 h-[370px] overflow-hidden">
                <SubjectMasteryChart data={subjectData} />
            </div>
            <div className="lg:col-span-4 h-[370px] overflow-hidden">
                <RankComparisonChart data={rankData} />
            </div>
            <div className="lg:col-span-4 h-[370px] overflow-hidden">
                <TimeEfficiencyChart data={timeData} />
            </div>

            {/* Row 3: Detailed Breakdown */}
            <div className="lg:col-span-12 mt-2 h-[600px]">
                <TopicPerformanceTable data={topicData} />
            </div>
        </div>
    )
}

export default AnalyticsGrid
