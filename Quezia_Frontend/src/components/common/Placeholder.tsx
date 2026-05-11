import React from 'react';

interface PlaceholderProps {
    icon?: React.ElementType;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    variant?: 'default' | 'error' | 'coming-soon';
}

const Placeholder: React.FC<PlaceholderProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className = '',
    variant = 'default',
}) => {
    const variantStyles = {
        default: 'text-[var(--color-text-tertiary)]',
        error: 'text-red-400',
        'coming-soon': 'text-blue-400',
    };

    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]/30 backdrop-blur-sm ${className}`}>
            {Icon && (
                <div className={`mb-4 p-4 rounded-full bg-[var(--color-bg-muted)] ${variantStyles[variant]}`}>
                    <Icon size={32} />
                </div>
            )}
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {title}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto mb-6">
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-xl text-sm font-medium hover:bg-[var(--color-bg-muted)] transition-all shadow-sm"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default Placeholder;
