import React, { useState } from 'react'
import { PencilSimple, Check, Camera, Crown } from '@phosphor-icons/react'

interface ProfileHeaderProps {
    displayName: string
    email: string
    username: string
    avatarUrl: string | null
    accountTier: string
    onUpdate: (fields: { displayName: string }) => void
}

const tierColors: Record<string, string> = {
    FREE: 'var(--color-text-tertiary)',
    PRO: 'var(--color-accent)',
    PREMIUM: '#F59E0B',
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    displayName,
    email,
    username,
    avatarUrl,
    accountTier,
    onUpdate,
}) => {
    const [editing, setEditing] = useState(false)
    const [editName, setEditName] = useState(displayName)

    const handleSave = () => {
        onUpdate({ displayName: editName })
        setEditing(false)
    }

    const initials = (displayName || username || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6">
            <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative group shrink-0">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-20 h-20 rounded-2xl object-cover border border-[var(--color-border-default)]"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-muted)] border border-[var(--color-border-default)] flex items-center justify-center">
                            <span className="text-2xl font-semibold text-[var(--color-text-secondary)]">
                                {initials}
                            </span>
                        </div>
                    )}
                    <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera size={20} className="text-white" />
                    </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        {editing ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-xl font-semibold text-[var(--color-text-primary)] bg-transparent border-b border-[var(--color-border-strong)] outline-none pb-0.5"
                                autoFocus
                            />
                        ) : (
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] truncate">
                                {displayName || username}
                            </h2>
                        )}

                        {/* Tier badge */}
                        <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 border shrink-0"
                            style={{
                                color: tierColors[accountTier] || tierColors.FREE,
                                borderColor: tierColors[accountTier] || tierColors.FREE,
                            }}
                        >
                            <Crown size={10} weight="fill" />
                            {accountTier}
                        </span>
                    </div>

                    <p className="text-sm text-[var(--color-text-tertiary)]">{email}</p>
                    <p className="text-xs text-[var(--color-text-disabled)] mt-0.5">@{username}</p>
                </div>

                {/* Edit toggle */}
                <button
                    onClick={editing ? handleSave : () => setEditing(true)}
                    className="shrink-0 w-9 h-9 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] flex items-center justify-center hover:border-[var(--color-border-hover)] transition-colors cursor-pointer"
                >
                    {editing ? (
                        <Check size={16} className="text-[var(--color-success)]" />
                    ) : (
                        <PencilSimple size={16} className="text-[var(--color-text-tertiary)]" />
                    )}
                </button>
            </div>
        </div>
    )
}

export default ProfileHeader
