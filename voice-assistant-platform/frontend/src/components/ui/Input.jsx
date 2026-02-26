import { forwardRef } from 'react'

function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cx(
        'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 ring-offset-white transition-all',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-slate-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})

export default Input
