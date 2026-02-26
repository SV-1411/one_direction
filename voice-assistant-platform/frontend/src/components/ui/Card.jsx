function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

export function Card({ className, ...props }) {
  return <div className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-300', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cx('flex flex-col space-y-1.5 px-6 py-5', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <div className={cx('text-lg font-bold leading-none tracking-tight text-slate-900', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <div className={cx('text-xs font-medium text-slate-400 italic', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cx('px-6 py-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }) {
  return <div className={cx('flex items-center px-6 py-4 border-t border-slate-100', className)} {...props} />
}
