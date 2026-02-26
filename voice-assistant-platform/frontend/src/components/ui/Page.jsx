function cx(...xs) {
  return xs.filter(Boolean).join(' ')
}

export function Page({ className, ...props }) {
  return <div className={cx('flex-1 min-h-screen p-4 md:p-8 lg:p-10 space-y-8 max-w-[1600px] mx-auto overflow-x-hidden animate-in fade-in duration-500', className)} {...props} />
}

export function PageHeader({ className, ...props }) {
  return <div className={cx('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6', className)} {...props} />
}

export function PageTitle({ className, ...props }) {
  return <h2 className={cx('text-3xl md:text-4xl font-black tracking-tight text-slate-900', className)} {...props} />
}

export function PageSubTitle({ className, ...props }) {
  return <p className={cx('text-sm md:text-base text-slate-500 max-w-2xl font-medium italic', className)} {...props} />
}

export function PageActions({ className, ...props }) {
  return <div className={cx('flex items-center gap-2', className)} {...props} />
}
