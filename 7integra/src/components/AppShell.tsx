import type { ReactNode } from 'react'
import useDarkMode from '../hooks/useDarkMode'

export default function AppShell({ children }: { children: ReactNode }) {
  const { enabled, toggle } = useDarkMode()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white p-4 flex justify-between">
        <h1 className="font-semibold">7Integra</h1>
        <button
          type="button"
          onClick={toggle}
          className="text-sm hover:opacity-80"
        >
          {enabled ? 'Light' : 'Dark'} Mode
        </button>
      </header>
      <main className="flex-1 p-4 bg-bg-light dark:bg-slate-800">
        {children}
      </main>
    </div>
  )
}
