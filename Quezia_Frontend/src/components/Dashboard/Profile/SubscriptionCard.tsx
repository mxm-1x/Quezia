import React from 'react'
import { CreditCard, ArrowRight, CheckCircle, Clock } from '@phosphor-icons/react'

interface SubscriptionCardProps {
    planName: string
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
    expiresAt: string
    daysRemaining: number
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    ACTIVE: { color: 'var(--color-success)', bg: 'var(--color-success-subtle)', label: 'Active' },
    EXPIRED: { color: 'var(--color-error)', bg: 'var(--color-error-subtle)', label: 'Expired' },
    CANCELLED: { color: 'var(--color-warning)', bg: 'var(--color-warning-subtle)', label: 'Cancelled' },
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    planName,
    status,
    expiresAt,
    daysRemaining,
}) => {
    const cfg = statusConfig[status] || statusConfig.ACTIVE

    return (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <CreditCard size={18} className="text-[var(--color-accent)]" />
                Subscription
            </h3>

            <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-lg font-semibold text-[var(--color-text-primary)]">{planName}</p>
                        <p className="text-xs text-[var(--color-text-disabled)] mt-0.5">Current plan</p>
                    </div>
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                        <CheckCircle size={10} weight="fill" />
                        {cfg.label}
                    </span>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                        <Clock size={14} />
                        <span>Expires {expiresAt}</span>
                    </div>
                    {status === 'ACTIVE' && (
                        <span className="text-xs font-medium text-[var(--color-text-disabled)]">
                            {daysRemaining} days remaining
                        </span>
                    )}
                </div>

                <button className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer">
                    Upgrade Plan <ArrowRight size={14} />
                </button>
            </div>
        </div>
    )
}

export default SubscriptionCard
