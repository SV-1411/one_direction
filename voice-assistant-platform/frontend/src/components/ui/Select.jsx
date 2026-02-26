import { forwardRef } from 'react'

function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

const Select = forwardRef(function Select({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cx(
        'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 ring-offset-white transition-all shadow-sm focus:border-emerald-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
        className,
      )}
      {...props}
    />
  )
})

export default Select
