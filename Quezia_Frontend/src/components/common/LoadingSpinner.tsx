import React from 'react'

interface LoadingSpinnerProps {
    /** Optional message below the spinner */
    message?: string
    /** Size variant */
    size?: 'sm' | 'md' | 'lg'
    /** If true, renders as a full-screen centered overlay */
    fullScreen?: boolean
}

const sizeMap = {
    sm: 'w-5 h-5 border-[2px]',
    md: 'w-8 h-8 border-[2px]',
    lg: 'w-12 h-12 border-[2.5px]',
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message,
    size = 'md',
    fullScreen = false,
}) => {
    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeMap[size]} rounded-full border-[var(--color-border-default)] border-t-[var(--color-text-primary)] animate-spin`}
            />
            {message && (
                <p className="text-[var(--color-text-tertiary)] text-xs tracking-wide animate-pulse">
                    {message}
                </p>
            )}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
                {spinner}
            </div>
        )
    }

    return spinner
}

export default LoadingSpinner
