import { PageHeader } from '../../components/shared/PageHeader';
import { SummaryCards } from '../../components/ui/SummaryCards';
import { Card } from '../../components/ui/Card';

export default function Dashboard() {
  const summaryCards = [
    { label: 'Running', value: 0 },
    { label: 'Stopped', value: 0 },
    { label: 'Total Servers', value: 0 },
    { label: 'CPU Avg', value: '—' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" />
      <SummaryCards cards={summaryCards} />
      <Card>
        <div className="text-center py-16 text-slate-500">
          Server activity and resource charts will appear here
        </div>
      </Card>
    </div>
  );
}
