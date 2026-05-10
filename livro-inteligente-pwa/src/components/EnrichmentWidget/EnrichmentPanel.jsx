import EnrichmentItem from './EnrichmentItem.jsx'

export default function EnrichmentPanel({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <EnrichmentItem key={item.id} item={item} />
      ))}
    </div>
  )
}