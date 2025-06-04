/* eslint-disable no-redeclare */
import { render, screen, fireEvent } from '@testing-library/react'
import AppShell from './AppShell'

it('toggles dark mode', () => {
  render(
    <AppShell>
      <div>content</div>
    </AppShell>
  )
  const button = screen.getByRole('button')
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  fireEvent.click(button)
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})
