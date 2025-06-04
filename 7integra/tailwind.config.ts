import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',
        'primary-light': '#3b82f6',
        'primary-lighter': '#93c5fd',
        'primary-lightest': '#eff6ff',
        secondary: '#2563eb',
        accent: '#f59e0b',
        'bg-light': '#f8fafc',
        'bg-white': '#ffffff',
        'text-dark': '#1e293b',
        'text-medium': '#475569',
        'text-light': '#64748b',
        'border-color': '#e2e8f0',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        female: '#ec4899',
        male: '#3b82f6',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
export default config
