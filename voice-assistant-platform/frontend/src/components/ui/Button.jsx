import { forwardRef } from 'react'

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-200 focus-visible:ring-emerald-500',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm shadow-slate-200 focus-visible:ring-slate-500',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 active:bg-emerald-100 focus-visible:ring-emerald-400 shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-900 active:bg-emerald-100 focus-visible:ring-emerald-400',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-200 focus-visible:ring-rose-500',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      )}
      {...props}
    />
  )
})

export default Button
