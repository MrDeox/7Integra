# 7Integra – Gestão Animal

This repo contains a modern React + TypeScript rewrite of the original single-file HTML project. It uses Vite and TailwindCSS for a fast developer experience.

## Setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

### Scripts

- `pnpm dev` – start dev server
- `pnpm build` – build production assets
- `pnpm lint` – run ESLint
- `pnpm test` – run unit tests with Vitest

## Architecture

- **src/components** – reusable UI components such as `AppShell`, `ChartCard`, `AnimalTable`, `PdfExportButton` and simple primitives in `ui.tsx`.
- **src/pages** – application pages (`DashboardPage`).
- **src/hooks** – custom hooks (`useDarkMode`).
- Tailwind theme is defined in `tailwind.config.ts` based on the original style variables.
- Charts and PDF export are lazy loaded to keep bundle size small.
- GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests and build on push.

## Testing

Example unit test `src/components/AppShell.test.tsx` ensures dark mode toggle works.

## Refactor notes

The project was scaffolded with Vite (`react-ts` template). The inline CSS and scripts from the original HTML were translated into modular React components with TailwindCSS for styling. Heavy libraries like Chart.js and jsPDF are dynamically imported.
