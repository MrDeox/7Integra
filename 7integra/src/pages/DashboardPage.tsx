import ChartCard from '../components/ChartCard'
import AnimalTable from '../components/AnimalTable'
import { Card } from '../components/ui'

const chartData = {
  labels: ['F', 'M'],
  datasets: [
    {
      label: 'Animals',
      data: [12, 9],
      backgroundColor: ['#ec4899', '#3b82f6'],
    },
  ],
}

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Animals by Sex" data={chartData} />
        <Card>
          <h2 className="font-medium mb-2">Summary</h2>
          <p>Welcome to 7Integra dashboard.</p>
        </Card>
      </div>
      <AnimalTable />
    </div>
  )
}
