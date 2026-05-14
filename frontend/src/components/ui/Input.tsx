'use client'
import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium" style={{ color: 'rgba(240,230,196,0.7)' }}>
            {label}
          </label>
        )}
        <div className="relative w-full">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'rgba(240,230,196,0.3)' }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={clsx(className)}
            style={{
              width: '100%',
              padding: icon ? '12px 16px 12px 40px' : '12px 16px',
              borderRadius: '8px',
              background: '#1a1a1a',
              border: error
                ? '1px solid rgba(220,38,38,0.6)'
                : '1px solid rgba(240,230,196,0.1)',
              color: '#f0e6c4',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(232,180,35,0.4)'
              e.target.style.boxShadow = '0 0 0 3px rgba(232,180,35,0.1)'
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error
                ? 'rgba(220,38,38,0.6)'
                : 'rgba(240,230,196,0.1)'
              e.target.style.boxShadow = 'none'
              props.onBlur?.(e)
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
