import React, { useRef, useEffect } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

export type DropdownOption<T extends string = string> = {
  value: T
  label: string
}

type BaseDropdownProps<T extends string = string> = {
  options: DropdownOption<T>[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  icon?: React.ReactNode
  placeholder?: string
  openUp?: boolean
  alignRight?: boolean
  popupWidth?: string
}

type SingleSelectProps<T extends string = string> = BaseDropdownProps<T> & {
  multiSelect?: false
  value: T
  onChange: (value: T) => void
  showActiveStyle?: boolean
}

type MultiSelectProps<T extends string = string> = BaseDropdownProps<T> & {
  multiSelect: true
  value: T[]
  onChange: (value: T[]) => void
  showActiveStyle?: boolean
}

type DropdownProps<T extends string = string> = SingleSelectProps<T> | MultiSelectProps<T>

// Block variant (YourTestsSection style)
export function BlockDropdown<T extends string = string>(props: DropdownProps<T>) {
  const {
    options,
    isOpen,
    setIsOpen,
    icon,
    placeholder = 'Select',
    openUp = false,
    alignRight = true,
    popupWidth = 'w-44',
    showActiveStyle = false,
  } = props

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  const isMulti = props.multiSelect === true
  const currentValue = props.value

  const getDisplayLabel = () => {
    if (isMulti) {
      const selected = options.filter((o) => (currentValue as T[]).includes(o.value))
      return selected.length > 0 ? selected.map((o) => o.label).join(', ') : placeholder
    }
    const selected = options.find((o) => o.value === currentValue)
    return selected?.label || placeholder
  }

  const isSelected = (optionValue: T) => {
    if (isMulti) {
      return (currentValue as T[]).includes(optionValue)
    }
    return currentValue === optionValue
  }

  const handleSelect = (optionValue: T) => {
    if (isMulti) {
      const current = currentValue as T[]
      const newValue = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue]
        ; (props as MultiSelectProps<T>).onChange(newValue)
    } else {
      ; (props as SingleSelectProps<T>).onChange(optionValue)
      setIsOpen(false)
    }
  }

  const hasValue = isMulti ? (currentValue as T[]).length > 0 : !!currentValue
  const isActive = showActiveStyle && hasValue

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 rounded-lg border text-sm flex items-center justify-between gap-2 transition w-full ${isActive
            ? 'border-white/20 bg-white/[0.06] text-neutral-200'
            : 'border-white/5 bg-white/[0.02] text-neutral-400 hover:text-neutral-300'
          }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          <span className="hidden sm:inline truncate">{getDisplayLabel()}</span>
        </div>
        <CaretDown size={12} className="shrink-0 text-neutral-500" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${alignRight ? 'right-0' : 'left-0'} ${openUp ? 'bottom-full mb-2' : 'mt-2'
            } ${popupWidth} rounded-xl border border-white/10 bg-neutral-900 p-1 z-20`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${isSelected(opt.value)
                  ? 'bg-white/[0.08] text-neutral-100'
                  : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200'
                }`}
            >
              {opt.label}
              {isMulti && isSelected(opt.value) && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Pill variant (PromptInput style)
export function PillDropdown<T extends string = string>(props: DropdownProps<T>) {
  const {
    options,
    isOpen,
    setIsOpen,
    icon,
    placeholder = 'Select',
    openUp = false,
    alignRight = false,
  } = props

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  const isMulti = props.multiSelect === true
  const currentValue = props.value

  const getDisplayLabel = () => {
    if (isMulti) {
      const selected = options.filter((o) => (currentValue as T[]).includes(o.value))
      return selected.length > 0 ? selected.map((o) => o.label).join(', ') : placeholder
    }
    const selected = options.find((o) => o.value === currentValue)
    return selected?.label || placeholder
  }

  const isSelected = (optionValue: T) => {
    if (isMulti) {
      return (currentValue as T[]).includes(optionValue)
    }
    return currentValue === optionValue
  }

  const handleSelect = (optionValue: T) => {
    if (isMulti) {
      const current = currentValue as T[]
      const newValue = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue]
        ; (props as MultiSelectProps<T>).onChange(newValue)
    } else {
      const newValue = currentValue === optionValue ? ('' as T) : optionValue
        ; (props as SingleSelectProps<T>).onChange(newValue)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 hover:bg-white/10 transition"
      >
        {icon}
        <span className="text-sm text-neutral-300">{getDisplayLabel()}</span>
        <CaretDown size={12} className="text-neutral-400" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${alignRight ? 'right-0' : 'left-0'} ${openUp ? 'bottom-full mb-2' : 'mt-2'
            } min-w-full rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-2 z-20`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm capitalize text-neutral-300 hover:bg-white/10 transition"
            >
              {opt.label}
              {isSelected(opt.value) && <Check size={14} className="text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
