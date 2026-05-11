import React, { useState } from 'react'
import ProfileHeader from '../../components/Dashboard/Profile/ProfileHeader'
import AcademicContext from '../../components/Dashboard/Profile/AcademicContext'

import SubscriptionCard from '../../components/Dashboard/Profile/SubscriptionCard'

const Account: React.FC = () => {
  // Mock profile state
  const [profile, setProfile] = useState({
    displayName: 'Shubham Mahanwar',
    email: 'shubham@quezia.io',
    username: 'shubham_m',
    avatarUrl: null as string | null,
    accountTier: 'FREE',
    targetExam: 'JEE',
    targetExamYear: 2026,
    preparationStage: 'Intermediate',
    studyGoal: 'Rank under 5000',

  })

  const update = (fields: Partial<typeof profile>) => {
    setProfile((prev) => ({ ...prev, ...fields }))
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Page title */}
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Profile</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            Manage your identity, academic preferences, and subscription.
          </p>
        </div>

        <ProfileHeader
          displayName={profile.displayName}
          email={profile.email}
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          accountTier={profile.accountTier}
          onUpdate={(fields) => update(fields)}
        />

        <AcademicContext
          targetExam={profile.targetExam}
          targetExamYear={profile.targetExamYear}
          preparationStage={profile.preparationStage}
          studyGoal={profile.studyGoal}

          onUpdate={(fields) => update(fields as Partial<typeof profile>)}
        />

        <SubscriptionCard
          planName="Free Tier"
          status="ACTIVE"
          expiresAt="Mar 15, 2026"
          daysRemaining={20}
        />
      </div>
    </div>
  )
}

export default Account