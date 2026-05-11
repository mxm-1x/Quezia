import React from 'react'

interface GlassCardProps {
  title: string
  subtitle: string
  headerAction?: React.ReactNode
  children: React.ReactNode
}

const GlassCard: React.FC<GlassCardProps> = ({ title, subtitle, headerAction, children }) => {
  return (
    <div className="relative z-10 px-8 py-10 w-full">
      <div
        className="relative mx-auto max-w-6xl rounded-[28px] border border-[var(--color-border-default)] backdrop-blur-xl px-10 py-12 overflow-visible"
        style={{
          backgroundImage: "url('/images/SpectralDark.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 rounded-[28px] bg-[rgba(0,0,0,0.6)]" />

        {/* content */}
        <div className="relative z-10 overflow-visible">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">{title}</h1>
              {headerAction}
            </div>
            <p className="mt-2 text-[var(--color-text-tertiary)]">{subtitle}</p>
          </div>

          {/* Chat container */}
          <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] backdrop-blur-md px-6 py-5 overflow-visible">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlassCard
