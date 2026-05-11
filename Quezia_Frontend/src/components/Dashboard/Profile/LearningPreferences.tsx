import React from 'react'
import { Sliders, Clock, Bell, BellSlash } from '@phosphor-icons/react'

interface LearningPreferencesProps {
    difficultyBias: string
    dailyStudyMinutes: number
    notifications: { email: boolean; push: boolean; weeklyReport: boolean }
    onUpdate: (fields: Partial<LearningPreferencesProps>) => void
}

const biasOptions = ['Easy-heavy', 'Balanced', 'Hard-heavy']
const timeOptions = [15, 30, 45, 60, 90, 120]

const LearningPreferences: React.FC<LearningPreferencesProps> = ({
    difficultyBias,
    dailyStudyMinutes,
    notifications,
    onUpdate,
}) => {
    const toggleNotification = (key: keyof typeof notifications) => {
        onUpdate({ notifications: { ...notifications, [key]: !notifications[key] } })
    }

    return (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <Sliders size={18} className="text-[var(--color-accent)]" />
                Learning Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Difficulty Bias */}
                <div>
                    <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-1.5 flex items-center gap-1.5">
                        <Sliders size={12} /> Difficulty Bias
                    </label>
                    <div className="flex gap-2">
                        {biasOptions.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => onUpdate({ difficultyBias: opt })}
                                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${difficultyBias === opt
                                        ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)]'
                                        : 'bg-[var(--color-bg-subtle)] border-[var(--color-border-default)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-hover)]'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Daily Study Target */}
                <div>
                    <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-1.5 flex items-center gap-1.5">
                        <Clock size={12} /> Daily Study Target
                    </label>
                    <select
                        value={dailyStudyMinutes}
                        onChange={(e) => onUpdate({ dailyStudyMinutes: Number(e.target.value) })}
                        className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] text-sm text-[var(--color-text-primary)] px-3 py-2.5 outline-none focus:border-[var(--color-accent)] transition-colors"
                    >
                        {timeOptions.map((t) => (
                            <option key={t} value={t}>{t} min</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Notification Toggles */}
            <div>
                <label className="text-xs font-medium text-[var(--color-text-disabled)] mb-3 flex items-center gap-1.5">
                    <Bell size={12} /> Notifications
                </label>
                <div className="space-y-3">
                    {([
                        { key: 'email' as const, label: 'Email Notifications' },
                        { key: 'push' as const, label: 'Push Notifications' },
                        { key: 'weeklyReport' as const, label: 'Weekly Performance Report' },
                    ]).map(({ key, label }) => (
                        <div
                            key={key}
                            className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-4 py-3"
                        >
                            <div className="flex items-center gap-2.5">
                                {notifications[key] ? (
                                    <Bell size={14} className="text-[var(--color-accent)]" />
                                ) : (
                                    <BellSlash size={14} className="text-[var(--color-text-disabled)]" />
                                )}
                                <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                            </div>
                            <button
                                onClick={() => toggleNotification(key)}
                                className={`relative w-10 h-[22px] rounded-full transition-colors cursor-pointer ${notifications[key]
                                        ? 'bg-[var(--color-accent)]'
                                        : 'bg-[var(--color-bg-muted)]'
                                    }`}
                            >
                                <span
                                    className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${notifications[key] ? 'left-[22px]' : 'left-[3px]'
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LearningPreferences
