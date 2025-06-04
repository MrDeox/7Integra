import { Suspense, lazy } from 'react'
import type { ChartData, ChartOptions } from 'chart.js'
import { Card } from './ui'

const LazyChart = lazy(() => import('./LazyChart'))

interface Props {
  title: string
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
}

export default function ChartCard({ title, data, options }: Props) {
  return (
    <Card>
      <h2 className="font-medium mb-2">{title}</h2>
      <Suspense fallback={<div>Loading chart...</div>}>
        <LazyChart data={data} options={options} />
      </Suspense>
    </Card>
  )
}
