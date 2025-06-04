import { useState } from 'react'

interface Props {
  data: unknown[]
}

export default function PdfExportButton({ data }: Props) {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    data.forEach((item, i) => {
      doc.text(JSON.stringify(item), 10, 10 + i * 10)
    })
    doc.save('animals.pdf')
    setLoading(false)
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-3 py-1 bg-secondary text-white rounded"
    >
      {loading ? 'Generating...' : 'Export PDF'}
    </button>
  )
}
