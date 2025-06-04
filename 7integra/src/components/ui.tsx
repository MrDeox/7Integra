import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-700 rounded shadow p-4 mb-4">
      {children}
    </div>
  )
}

export function Modal({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-4 rounded shadow">
        {children}
      </div>
    </div>
  )
}
