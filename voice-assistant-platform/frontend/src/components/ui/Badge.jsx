function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

const variants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
}

export default function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    />
  )
}
