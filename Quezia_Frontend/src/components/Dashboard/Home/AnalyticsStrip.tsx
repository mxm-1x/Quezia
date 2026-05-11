import React from 'react'
import MiniLineGraph from '../../common/MiniLineGraph'
import SectionStrip from '../../common/SectionStrip'
import { ArrowUpRight } from '@phosphor-icons/react'

const AnalyticsStrip: React.FC = () => {
  const actions = (
    <>
      <button className="h-7 w-7 rounded-md border border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] transition" />
      <button
        onClick={() => (window.location.href = '/dashboard/analytics')}
        className="h-7 w-7 rounded-md border border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] transition flex items-center justify-center"
      >
        <ArrowUpRight size={14} className="text-[var(--color-text-primary)]" />
      </button>
    </>
  )

  const WIPOverlay = () => (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-bg-base)]/40 backdrop-blur-[2px] rounded-2xl border border-white/5 group-hover:bg-[var(--color-bg-base)]/30 transition-all duration-300">
      <div className="px-3 py-1 rounded-full bg-[var(--color-accent-subtle)]/20 border border-[var(--color-accent-subtle)]/30 text-[10px] uppercase tracking-wider font-bold text-[var(--color-accent-subtle)] mb-2">
        Work in Progress
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)] font-medium">Coming Soon</p>
    </div>
  )

  return (
    <SectionStrip title="Performance overview" actions={actions}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Rank */}
        <div className="group relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] min-h-[160px]">
          <WIPOverlay />
          {/* Text block */}
          <div className="px-6 pt-5 pb-4 opacity-40 grayscale-[0.5]">
            <p className="text-sm text-[var(--color-text-tertiary)]">Rank trajectory</p>

            <div className="mt-3">
              <h3 className="text-3xl font-semibold text-[var(--color-text-primary)]">
                ↑ Improving
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-disabled)]">
                Average rank across recent tests
              </p>
            </div>
          </div>

          {/* Graph block (edge-to-edge) */}
          <div className="pb-4 opacity-20 grayscale">
            <MiniLineGraph data={[12, 1, 20, 3, 4, 2]} color="var(--color-info)" />
          </div>
        </div>

        {/* Time */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] min-h-[160px]">
          <WIPOverlay />
          <div className="px-6 pt-5 pb-4 opacity-40 grayscale-[0.5]">
            <p className="text-sm text-neutral-400">Time efficiency</p>

            <div className="mt-3">
              <h3 className="text-3xl font-semibold text-white">1.42×</h3>
              <p className="mt-1 text-sm text-neutral-500">Faster than exam benchmark</p>
            </div>
          </div>

          <div className="pb-4 opacity-20 grayscale">
            <MiniLineGraph data={[1.0, 1.1, 2.2, 1.3, 1.4, 1.42]} color="var(--color-info)" />
          </div>
        </div>

        {/* Stability */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] min-h-[160px]">
          <WIPOverlay />
          <div className="px-6 pt-5 pb-4 opacity-40 grayscale-[0.5]">
            <p className="text-sm text-neutral-400">Topic stability</p>

            <div className="mt-3">
              <h3 className="text-3xl font-semibold text-white">78%</h3>
              <p className="mt-1 text-sm text-neutral-500">Topics in stable mastery zone</p>
            </div>
          </div>

          <div className="pb-4 opacity-20 grayscale">
            <MiniLineGraph data={[65, 68, 72, 75, 77, 78]} color="var(--color-error)" />
          </div>
        </div>
      </div>
    </SectionStrip>
  )
}

export default AnalyticsStrip
