import { Card } from './Card';

interface SummaryCardData {
  label: string;
  value: string | number;
}

interface SummaryCardsProps {
  cards: SummaryCardData[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">{card.label}</div>
          <div className="text-3xl font-bold text-slate-100">{card.value}</div>
        </Card>
      ))}
    </div>
  );
}
