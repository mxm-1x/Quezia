import React from 'react'
import { User, Users, Trophy } from '@phosphor-icons/react'

export type CompareMode = 'personal' | 'peer' | 'top'

interface Props {
    mode: CompareMode
    onChange: (mode: CompareMode) => void
}

const CompareModeToggle: React.FC<Props> = ({ mode, onChange }) => {
    const options: { id: CompareMode; label: string; icon: React.ElementType }[] = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'peer', label: 'vs Peers', icon: Users },
        { id: 'top', label: 'vs Top 1%', icon: Trophy },
    ]

    return (
        <div className="bg-[var(--color-bg-subtle)] p-1 rounded-xl border border-[var(--color-border-default)] flex items-center">
            {options.map((option) => {
                const isActive = mode === option.id
                const Icon = option.icon

                return (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                            ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-default)]'
                            : 'text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]'
                            }`}
                    >
                        <Icon weight={isActive ? "fill" : "regular"} className={isActive ? "text-[var(--color-accent)]" : ""} />
                        <span>{option.label}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default CompareModeToggle
