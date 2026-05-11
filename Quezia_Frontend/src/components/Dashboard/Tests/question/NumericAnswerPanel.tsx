import React, { useCallback } from 'react'
import { Backspace } from '@phosphor-icons/react'

export type NumericRules = {
  allowDecimals?: boolean
  maxDecimalPlaces?: number
  allowNegative?: boolean
  roundOnSubmit?: boolean
}

type Props = {
  value: string
  onChange: (value: string) => void
  rules?: NumericRules
}

const NumericAnswerPanel: React.FC<Props> = ({ value, onChange, rules = {} }) => {
  const {
    allowDecimals = false,
    maxDecimalPlaces = 2,
    allowNegative = true,
  } = rules

  // Derive helper text based on rules
  const getHelperText = (): string => {
    if (rules.roundOnSubmit) {
      return 'Answer will be rounded to the nearest integer.'
    }
    if (allowDecimals) {
      return `Enter value up to ${maxDecimalPlaces} decimal places.`
    }
    return 'Enter the final integer value. Units are not required.'
  }

  // Derive rule indicator text
  const getRuleIndicator = (): string => {
    if (rules.roundOnSubmit) return 'Round to nearest integer'
    if (allowDecimals) return `Up to ${maxDecimalPlaces} decimal places`
    return 'Integer only'
  }

  // Handle keypad input
  const handleKey = useCallback((key: string) => {
    let newValue = value

    if (key === 'clear') {
      onChange('')
      return
    }

    if (key === 'backspace') {
      onChange(value.slice(0, -1))
      return
    }

    if (key === '-') {
      if (!allowNegative) return
      // Toggle negative
      if (value.startsWith('-')) {
        onChange(value.slice(1))
      } else if (value === '' || value === '0') {
        onChange('-')
      } else {
        onChange('-' + value)
      }
      return
    }

    if (key === '.') {
      if (!allowDecimals) return
      if (value.includes('.')) return // Only one decimal allowed
      if (value === '' || value === '-') {
        onChange(value + '0.')
      } else {
        onChange(value + '.')
      }
      return
    }

    // Digit input
    if (/^\d$/.test(key)) {
      // Check decimal places limit
      if (allowDecimals && value.includes('.')) {
        const decimalPart = value.split('.')[1] || ''
        if (decimalPart.length >= maxDecimalPlaces) return
      }

      newValue = value + key

      // Clean leading zeros (but keep "0." for decimals)
      if (!newValue.includes('.')) {
        const isNegative = newValue.startsWith('-')
        let numPart = isNegative ? newValue.slice(1) : newValue
        numPart = numPart.replace(/^0+(\d)/, '$1')
        newValue = isNegative ? '-' + numPart : numPart
      }

      onChange(newValue)
    }
  }, [value, onChange, allowDecimals, maxDecimalPlaces, allowNegative])

  // Display value
  const displayValue = value === '' ? '—' : value

  // Keypad layout
  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['-', '0', allowDecimals ? '.' : null],
  ]

  return (
    <div className="fixed left-0 top-14 bottom-16 w-60 border-r border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-4 flex flex-col z-20">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
          Final Numerical Answer
        </h3>
        <p className="text-[10px] text-[var(--color-text-disabled)]">
          {getRuleIndicator()}
        </p>
      </div>

      {/* Answer Display */}
      <div className="mb-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] py-6 px-4">
        <div
          className={`text-center font-mono text-2xl ${value === '' ? 'text-[var(--color-text-disabled)]' : 'text-[var(--color-text-primary)]'
            }`}
        >
          {displayValue}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.flat().map((key, i) => {
          if (key === null) return <div key={i} />

          return (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="aspect-square rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] text-lg font-medium hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-strong)] transition-colors active:scale-95"
            >
              {key}
            </button>
          )
        })}
      </div>

      {/* Action row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleKey('backspace')}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] text-sm hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-strong)] transition-colors"
        >
          <Backspace size={16} />
        </button>
        <button
          onClick={() => handleKey('clear')}
          className="py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] text-[var(--color-text-tertiary)] text-sm hover:bg-[var(--color-bg-muted)] hover:border-[var(--color-border-strong)] transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-4 text-[10px] text-[var(--color-text-disabled)] leading-relaxed">
        {getHelperText()}
      </p>
    </div>
  )
}

export default NumericAnswerPanel
