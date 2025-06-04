import PdfExportButton from './PdfExportButton'

interface Animal {
  id: number
  name: string
  weight: number
}

const sample: Animal[] = [
  { id: 1, name: 'Bessie', weight: 450 },
  { id: 2, name: 'Duke', weight: 500 },
]

export default function AnimalTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-color">
        <thead>
          <tr className="bg-primary-light text-white">
            <th className="px-2 py-1 text-left">ID</th>
            <th className="px-2 py-1 text-left">Name</th>
            <th className="px-2 py-1 text-left">Weight</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-border-color">
          {sample.map((a) => (
            <tr key={a.id}>
              <td className="px-2 py-1">{a.id}</td>
              <td className="px-2 py-1">{a.name}</td>
              <td className="px-2 py-1">{a.weight} kg</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-right">
        <PdfExportButton data={sample} />
      </div>
    </div>
  )
}
