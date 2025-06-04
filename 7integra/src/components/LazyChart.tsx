import { Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function LazyChart({ data, options }: { data: ChartData<'bar'>; options?: ChartOptions<'bar'> }) {
  return <Bar data={data} options={options} />
}
